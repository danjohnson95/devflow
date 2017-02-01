const 	request = require('request'),
		timeAgo = require('./timeago.js'),
		cache = require('./cache.js'),
		config = require('./config.js');

module.exports = {

	refresh_token: null,
	access_token: null,
	hostname: 'https://api.bitbucket.org/2.0/',
	refresh_error: "Access token expired. Use your refresh token to obtain a new access token.",


	/**
	 * Returns the URL which the user should be taken to which initiates the authentication process
	 */
	getAuthenticateURL: function(){
		return "https://bitbucket.org/site/oauth2/authorize?client_id=XQZgdxhJ6B65Cnk3UQ&response_type=code";
	},

	/**
	 * Submits a request to the chosen endpoint, using the specified method.
	 * Passes through the access_token in the auth header
	 * Runs callback after request completed containing err and response body.
	 */
	doAuthenticatedRequest: function(endpoint, options, callback){
		var obj = this,
			opt = {};
		opt.method = options.method || "get";
		opt.body = options.body || null;

		this.getAccessToken(function(){
			request({
				url: obj.hostname+endpoint,
				method: opt.method,
				json: true,
				auth: {
					'bearer': obj.access_token
				},
				body: opt.body
			}, function(err, resp, body){
				if(err) throw err;
				if(body.type && body.type == "error" && body.error.message == obj.refresh_error){
					obj.refreshAccessToken(function(){
						obj.doAuthenticatedRequest(endpoint, opt, callback);
					});
				}else{
					callback(err, body);
				}
			});
		});
	},


	/**
	 * Sets the access token needed to authenticate API requests
	 */
	setAccessToken: function(access_token, callback){
		this.access_token = access_token;
		cache.config.update({type: 'access_token'}, {type: 'access_token', value: access_token}, {upsert: true}, function(err, num){
			callback();
		});
	},

	/**
	 * Sets the code that we need to get to get the access_token
	 */
	setRefreshToken: function(refresh_token){
		this.refresh_token = refresh_token;
		cache.config.update({type: 'refresh_token'}, {type: 'refresh_token', value: refresh_token}, {upsert: true});
	},


	/**
	 * Gets the access token by first looking in this object,
	 * then checking the cache
	 */
	 getAccessToken: function(callback){
	 	var obj = this;
	 	if(!obj.access_token){
	 		cache.config.findOne({type:'access_token'}, function(err, key){
	 			if(!key || !key.value){
	 				obj.requestAccessToken(true, callback);
	 			}else{
	 				obj.access_token = key.value;
	 				callback();
	 			}
	 		});
	 	}else{
	 		callback();
	 	}
	},

	/**
	 * Requests a new access token from BitBucket by providing the refresh_token
	 */
	refreshAccessToken: function(callback){

		var obj = this;
		cache.config.findOne({type: 'refresh_token'}, function(err, key){
			if(!key) throw "No refresh token found";
			request({
				url:'https://bitbucket.org/site/oauth2/access_token',
				method:'post',
				auth: {
					user: config.key,
					pass: config.secret
				},
				form: {
					grant_type: 'refresh_token',
					refresh_token: key.value
				}
			}, function(err, response, body){
				resp = JSON.parse(body);
				// TODO: Store the time in which this will expire, and then grab a new one before requesting.
				obj.setAccessToken(resp.access_token, callback);
			});
		});

	},


	/**
	 * Requests an access token from BitBucket using OAuth2.0
	 */
	requestAccessToken: function(code, callback){
		var obj = this,
			resp = {};

		request({
		    url: 'https://bitbucket.org/site/oauth2/access_token',
		    method:'post',
		    auth: {
		    	user: config.key,
		    	pass: config.secret
		    },
		    form: {
		    	grant_type: 'authorization_code',
		    	code: code
		    }
	  	}, function(err, response, body){
	  		resp = JSON.parse(body);
	  		obj.setRefreshToken(resp.refresh_token);
	  		obj.setAccessToken(resp.access_token, function(){
	  			callback();
	  		});
	  	});
	},



	/**
	 * Returns an object of the repositories the current user has write access to
	 * and stores it in the cache
	 */
	getRepos: function(callback){
		this.doAuthenticatedRequest('repositories?role=contributor', {}, function(err, repos){
			if(!repos.values) callback(err, repos);
			repos.values.forEach(function(e, i){
				cache.repo.update({'uuid':e.uuid}, e, {upsert: true}, function(err, num){
					callback(err, repos);
				});

			});
		});
	},


	/**
	 * Returns an object of issues relating to the given repository
	 * The repo must contain the username AND the repository name,
	 * for example: danjohnson95/devflow
	 * This function also modifies the response to show timestamps, and also
	 * to include the full repository name
	 */
	 getIssues: function(repo, callback){
	 	this.doAuthenticatedRequest('repositories/'+repo+'/issues', {}, function(err, issues){
	 		
	 		if(!issues.values || !issues.values.length) return callback(err, issues);
	 		var promises = [];
	 		issues.repo_slug = repo;
	 		issues.repo_id = issues.values[0].repository.uuid;
	 		issues.values.forEach(function(e, i){

	 			promises.push(new Promise(function(resolve, reject){
		 			e.updated_html = timeAgo.html(e.updated_on);
		 			e.cached_on = new Date();
		 			e.repo_id = e.repository.uuid;
		 			e.issue_id = e.repo_id+""+parseInt(e.id);
		 			console.log(e);
		 			cache.issues.update({issue_id: e.issue_id}, e, {upsert: true}, function(err, num){
		 				if(err) reject();
		 				resolve();
		 			});
		 		}));

	 		});

	 		Promise.all(promises).then(values => {
	 			//console.log(issues);
	 			callback(null, issues);
	 		});

	 	});
 	},


	/**
	 * Returns an object of an individual issue containing both attachments and comments.
	 */
	getIssueDetail: function(repo_slug, repo_id, issue_id, callback){

		var getAttachments = this.getIssueAttachments(repo_slug, issue_id);
		var getComments = this.getIssueComments(repo_slug, issue_id);

		Promise.all([getAttachments, getComments]).then(values => {
			cache.issue.update({repo_id: repo_id, id: parseInt(issue_id)}, {attachments: values[0].values, comments: values[1].values, cached_on: new Date()}, {upsert: true}, function(err, num, issue){
				callback(null, issue);
			});
		});

	},


	/**
	 * Returns an object containing any attachments relating to the issue provided.
	 */
	getIssueAttachments: function(repo_slug, issue_id){
		var obj = this;
		return new Promise(function(resolve, reject){
			obj.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id+'/attachments', {}, function(err, attachments){
				if(err) reject(err);
				resolve(attachments);
			});
		});
	},


	/**
	 * Returns an object containing comments relating to the issue provided.
	 */
	getIssueComments: function(repo_slug, issue_id){
		var obj = this;
		return new Promise(function(resolve, reject){
			obj.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id+'/comments', {}, function(err, comments){
			
				if(err) reject(err);
				if(comments.values.length > 0){
					comments.values.forEach(function(e, i){
						comments.values[i].created_html = timeAgo.html(e.created_on);
					});
				}
				resolve(comments);

			});
		});
	},

	postNewIssue: function(obj, callback){
		console.log('post new issue');
		// TODO: Should really do some serverside checks here.
		this.doAuthenticatedRequest('repositories/'+obj.repo+'/issues', {
			method: 'post',
			body: {
				priority: 'trivial',
				kind:'bug',
				title: obj.title,
				state: 'new',
				content: {
					raw: obj.body,
					markup: 'markdown'
				}
			}
		}, function(err, newIssue){
			console.log(err);
			// Now cache it.
			newIssue.updated_html = timeAgo.html(newIssue.updated_on);
	 		newIssue.repo_id = newIssue.repository.uuid;
			cache.issues.insert(newIssue, function(err, issue){
				callback(err, newIssue);
			});
		});

	}

}