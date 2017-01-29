const repoSidebar = document.getElementById('repo-sidebar'),
	  template = repoSidebar.querySelector('.template'),
	  newIssueModal = require('./new-issue-modal.js'),
	  issues = require('./issues.js'),
	  {ipcRenderer} = require('electron');

	  template.classList.remove('template');

var obj = {

	currentRepo: null,

	requestRepos: function(){
		ipcRenderer.send('show-repos');
	},

	clearRepos: function(){
		repoSidebar.innerHTML = "";
	},

	insertRepos: function(repos){
		obj.clearRepos();
		repos.forEach(function(e){
			template.dataset.repo_slug = e.full_name;
  			template.dataset.repo_id = e.uuid;
			template.innerHTML = "<img src='"+e.links.avatar.href+"'>"+e.name;
			repoSidebar.innerHTML += template.outerHTML;
		});
		obj.registerEventListeners();
		newIssueModal.setRepos(repos);
	},

	getRepoLinks: function(){
		return repoSidebar.querySelectorAll('li');
	},

	makeAllLinksInactive: function(){
		obj.getRepoLinks().forEach(function(e){
			if(e.classList.contains('active')) e.classList.remove('active');
		});
	},

	setCurrentRepo: function(repo){
		// TODO: Cache this.
		obj.currentRepo = repo;
	},

	clickRepo: function(){
		var elem = this;
		if(elem.classList.contains('active')) return;
		obj.makeAllLinksInactive();
		elem.classList.add('active');
		issues.requestIssues({
			repo_id: elem.dataset.repo_id,
			repo_slug: elem.dataset.repo_slug
		});
		newIssueModal.setCurrentRepo(elem.dataset.repo_slug);
	},

	registerEventListeners: function(){
		[].map.call(obj.getRepoLinks(), function(elem){
			elem.addEventListener('click', obj.clickRepo);
		});
	}

};

module.exports = obj;