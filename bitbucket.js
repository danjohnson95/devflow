var request = require('request'),
	timeAgo = require('./timeago.js');

module.exports = {

	code: null,
	access_token: null,
	hostname: 'https://api.bitbucket.org/2.0/',


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
	doAuthenticatedRequest: function(endpoint, method, callback){
		if(!this.access_token) throw "Access token has not been defined";
		var obj = this;
		request({
			url: obj.hostname+endpoint,
			method: method,
			auth: {
				'bearer': obj.access_token
			}
		}, function(err, resp, body){
			console.log(body);
			callback(err, JSON.parse(body));
		});
	},


	/**
	 * Sets the code that we need to get to get the access_token
	 */
	setToken: function(code){
		this.code = code;
	},


	/**
	 * Sets the access token needed to authenticate API requests
	 */
	setAccessToken: function(access_token){
		this.access_token = access_token;
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
		    	"code": obj.code
		    }
	  	}, function(err, response, body){
	  		resp = JSON.parse(body);
	  		obj.access_token = resp.access_token;
	  		callback();
	  	});
	},



	/**
	 * Returns an object of the repositories the current user has write access to
	 */
	getRepos: function(callback){
		this.doAuthenticatedRequest('repositories?role=contributor', 'get', callback);
	},


	/**
	 * Returns an object of issues relating to the given repository
	 * The repo must contain the username AND the repository name,
	 * for example: danjohnson95/devflow
	 * This function also modifies the response to show timestamps, and also
	 * to include the full repository name
	 */
	 getIssues: function(repo, callback){
	 	this.doAuthenticatedRequest('repositories/'+repo+'/issues', 'get', function(err, issues){
	 		issues.repo_id = repo;
	 		issues.values.forEach(function(e, i){
	 			issues.values[i].updated_html = timeAgo.html(e.updated_on);
	 		});
	 		callback(err, issues);
	 	});
 	},

	/**
	 * Returns an object of an individual issue, using the provided repo and issue ID
	 */
	getIssue: function(issue, callback){
		this.doAuthenticatedRequest('repositories/'+issue, 'get', function(err, issue){
			issue.created_html = timeAgo.html(issue.created_on);
			callback(err, issue);
		});
	}

}