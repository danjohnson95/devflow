const 	path = require('path'),
		electron = require('electron'),
		app = electron.app;

var 	Datastore = require('nedb'), 
		repoCache = new Datastore({ filename: path.join(app.getPath('userData'), 'repos.db'), autoload: true }),
		configCache = new Datastore({ filename: path.join(app.getPath('userData'), 'configcache.db'), autoload: true }),
		issueCache = new Datastore({ filename: path.join(app.getPath('userData'), 'issues.db'), autoload: true });

module.exports = {

	repo: repoCache,
	config: configCache,
	issues: issueCache

};