const 	request = require('request'),
		timeAgo = require('./timeago.js'),
		cache = require('./cache.js');

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
			console.log(obj.access_token);

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
					console.log('access token has expired');
					obj.requestAccessToken(true, function(){
						console.log('new token got');
						obj.doAuthenticatedRequest(endpoint, opt, callback);
					});
				}else{
					callback(err, body);
				}
			});
		});
	},


	/**
	 * Sets the code that we need to get to get the access_token
	 */
	setRefreshToken: function(refresh_token, callback){
		this.refresh_token = refresh_token;
		//cache.set('config', {refresh_token: refresh_token}, function(err){
		cache.config.update({type: 'refresh_token'}, {type: 'refresh_token', value: refresh_token}, {upsert: true}, function(err, num){
			console.log(err);
			console.log(num);
			callback();
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
		//cache.set('config', {access_token: access_token}, function(){
		//	callback();
		//});
	},

	refreshAccessToken: function(callback){

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
	 * Requests an access token from BitBucket using OAuth2.0
	 */
	requestAccessToken: function(refresh, callback){
		var obj = this,
			resp = {};

		cache.config.findOne({type: 'refresh_token'}, function(err, key){
			console.log(key.value);
			if(!key) throw "Your refresh token has gone";
			
			if(refresh){
				var form = {
					"grant_type": "refresh_token",
					"refresh_token": key.value
				}
			}else{
				var form = {
					"grant_type": "authorization_code",
					"code": key.value
				}
			}

			request({
			    url: 'https://bitbucket.org/site/oauth2/access_token',
			    method:'post',
			    auth: {
			    	user: "XQZgdxhJ6B65Cnk3UQ",
			    	pass: "EJ5UgWBpK2njZs73CJwWyVXGURJSxYA8"
			    },
			    form: form
		  	}, function(err, response, body){
		  		console.log(response);
		  		resp = JSON.parse(body);
		  		obj.setAccessToken(resp.access_token, function(){
		  			callback();
		  		});
		  	});
		});
	},



	/**
	 * Returns an object of the repositories the current user has write access to
	 * and stores it in the cache
	 */
	getRepos: function(callback){
		this.doAuthenticatedRequest('repositories?role=contributor', {}, function(err, repos){
			//cache.set('repos', repos, function(){
			if(!repos.values) callback(err, repos);
			repos.values.forEach(function(e, i){
				cache.repo.update({'uuid':e.uuid}, e, {upsert: true}, function(err, num){
					console.log('STORED IN CACHE');
					console.log(num);
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
	 	//console.log(repo);
	 	this.doAuthenticatedRequest('repositories/'+repo+'/issues', {}, function(err, issues){
	 		//console.log(issues);
	 		if(!issues.values || !issues.values.length) return callback(err, issues);
	 		issues.repo_slug = repo;
	 		console.log(issues);
	 		issues.repo_id = issues.values[0].repository.uuid;
	 		issues.values.forEach(function(e, i){
	 			e.updated_html = timeAgo.html(e.updated_on);
	 			e.repo_id = e.repository.uuid;
	 			//issues.values[i].updated_html = timeAgo.html(e.updated_on);
	 			cache.issues.update({repo_id: repo, id: e.id}, e, {upsert: true}, function(err, num){
	 				callback(err, issues);
	 			})
	 		});
	 	});
 	},


	/**
	 * Returns an object of an individual issue, using the provided repo and issue ID
	 */
	getIssue: function(repo_slug, issue_id, callback){
		this.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id, {}, function(err, issue){
			issue.created_html = timeAgo.html(issue.created_on);
			issue.repo_id = issue.repository.uuid;
			cache.issue.update({repo_id: issue.repository.uuid, id: issue.id}, issue, {upsert: true}, function(err, num){
				callback(err, issue);
			})
		});
	},


	/**
	 * Returns an object containing any attachments relating to the issue provided.
	 */
	getIssueAttachments: function(repo_slug, issue_id, callback){
		this.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id+'/attachments', {}, function(err, attachments){
			callback(err, attachments);
		});
	},


	/**
	 * Returns an object containing comments relating to the issue provided.
	 */
	getIssueComments: function(repo_slug, issue_id, callback){
		this.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id+'/comments', {}, function(err, comments){
			if(comments.values.length > 0){
				comments.values.forEach(function(e, i){
					comments.values[i].created_html = timeAgo.html(e.created_on);
				});
			}
			callback(err, comments);
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