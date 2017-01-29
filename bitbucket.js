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

		this.getAccessToken(function(){
			console.log(obj.access_token);

			request({
				url: obj.hostname+endpoint,
				method: opt.method,
				auth: {
					'bearer': obj.access_token
				}
			}, function(err, resp, body){
				console.log(err);
				body = JSON.parse(body);
				console.log(body);
				if(body.type && body.type == "error" && body.error.message == obj.refresh_error){
					console.log('access token has expired');
					obj.requestAccessToken(function(){
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
	 		//cache.get('config', function(err, config){
	 		
	 			if(Object.keys(key).length === 0 && key.constructor === Object || !key.value){
	 				obj.requestAccessToken(callback);
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
	requestAccessToken: function(callback){
		var obj = this,
			resp = {};

		request({
		    url: 'https://bitbucket.org/site/oauth2/access_token',
		    method:'post',
		    auth: {
		    	user: "XQZgdxhJ6B65Cnk3UQ",
		    	pass: "EJ5UgWBpK2njZs73CJwWyVXGURJSxYA8"
		    },
		    form: {
		    	"grant_type": "authorization_code",
		    	"code": obj.refresh_token
		    }
	  	}, function(err, response, body){
	  		resp = JSON.parse(body);
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
		this.doAuthenticatedRequest('repositories?role=contributor', 'get', function(err, repos){
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
	 	this.doAuthenticatedRequest('repositories/'+repo+'/issues', 'get', function(err, issues){
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
		this.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id, 'get', function(err, issue){
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
		this.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id+'/attachments', 'get', function(err, attachments){
			callback(err, attachments);
		});
	},


	/**
	 * Returns an object containing comments relating to the issue provided.
	 */
	getIssueComments: function(repo_slug, issue_id, callback){
		this.doAuthenticatedRequest('repositories/'+repo_slug+'/issues/'+issue_id+'/comments', 'get', function(err, comments){
			if(comments.values.length > 0){
				comments.values.forEach(function(e, i){
					comments.values[i].created_html = timeAgo.html(e.created_on);
				});
			}
			callback(err, comments);
		});
	},

	postNewIssue: function(obj, callback){

		// TODO: Should really do some serverside checks here.
		this.doAuthenticatedRequest('repositories/'+obj.repo+'/issues', 'post')

	}

}