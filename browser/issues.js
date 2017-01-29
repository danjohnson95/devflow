const {ipcRenderer} = require('electron'),
	issueListOuter = document.getElementById('issue-list'),
	issueList = issueListOuter.querySelector('#issue-list-inner'),
	issueContents = document.getElementById('issue-contents'),
	template = issueList.querySelector('.template'),
	issueListPlaceholder = issueListOuter.querySelector('.placeholder'),
	issueContentsPlaceholder = issueContents.querySelector('.placeholder');
	

	template.classList.remove('template');

var obj = {

	requestIssues: function(repo){
		ipcRenderer.send('show-issues', repo);
	},

	requestOneIssue: function(issue){
		ipcRenderer.send('show-issue', issue);
	},

	clearList: function(){
		issueList.innerHTML = "";
	},

	showIssueContentsPlaceholder: function(){
		issueContentsPlaceholder.classList.contains('hide') ? issueContentsPlaceholder.classList.remove('hide') : "";
	},

	hideIssueListPlaceholder: function(){
		!issueListPlaceholder.classList.contains('hide') ? issueListPlaceholder.classList.add('hide') : "";
	},

	insertIssues: function(issues){
		obj.clearList();
		obj.showIssueContentsPlaceholder();
		obj.hideIssueListPlaceholder();
		issues.forEach(function(e){
			issueList.innerHTML += obj.generateNewIssueBlockHTML(e);
		});
		obj.registerEventListeners();
	},

	getIssueLinks: function(){
		return issueList.querySelectorAll('.issue-box');
	},

	makeAllLinksInactive: function(){
		obj.getIssueLinks().forEach(function(e){
			if(e.classList.contains('active')) e.classList.remove('active');
		});
	},

	showBareDetails: function(){
		// TODO: Show the bare details we already have in the contents box.
	},

	clickIssue: function(elem){
		var elem = this;
		if(elem.classList.contains('active')) return;
		obj.makeAllLinksInactive();
		elem.classList.add('active');
		obj.showBareDetails(elem);
		obj.requestOneIssue({
			repo_id: elem.dataset.repo_id,
			issue_id: elem.dataset.id,
			repo_slug: elem.dataset.repo_slug
		});
	},

	registerEventListeners: function(){
		[].map.call(obj.getIssueLinks(), function(elem){
			elem.addEventListener('click', obj.clickIssue);
		});
	},

	generateNewIssueBlockHTML: function(issue){
		template.dataset.id = issue.id;
		template.dataset.repo_id = issue.repository.uuid;
		template.dataset.repo_slug = issue.repository.full_name;

		template.querySelector('.priority').dataset.priority = issue.priority;
		template.querySelector('.issue-status').dataset.state = issue.state;
		template.querySelector('.issue-status .issue-status-label').innerHTML = issue.state;
		template.querySelector('.issue-id').innerHTML = "#"+issue.id;
		template.querySelector('.issue-date').innerHTML = issue.updated_html;
		template.querySelector('.issue-title').innerHTML = issue.title;
		template.querySelector('.issue-labels label').innerHTML = issue.kind;

		if(issue.assignee){
			template.querySelector('.issue-assignees span').innerHTML = "@"+issue.assignee.username;
			!template.querySelector('.issue-assignees span').classList.contains('user') ? template.querySelector('.issue-assignees span').classList.add('user') : "";
		}else{
			template.querySelector('.issue-assignees span').innerHTML = "nobody";
			template.querySelector('.issue-assignees span').classList.contains('user') ? template.querySelector('.issue-assignees span').classList.remove('user') : "";
		}

		console.log(template.outerHTML);

		return template.outerHTML;

	}


};

module.exports = obj;