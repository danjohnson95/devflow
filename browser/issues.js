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

	prependIssue: function(issue){
		issueList.innerHTML = obj.generateNewIssueBlockHTML(issue) + issueList.innerHTML;
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
			elem.removeEventListener('click', obj.clickIssue);
			elem.addEventListener('click', obj.clickIssue);
		});
	},

	generateNewIssueBlockHTML: function(issue){
		template.dataset.id = issue.id;
		template.dataset.repo_id = issue.repository.uuid;
		template.dataset.repo_slug = issue.repository.full_name;
		template.dataset.issue_kind = issue.kind;
		template.dataset.issue_state = issue.state;
		template.dataset.disabled = (issue.state == "closed" || issue.state == "resolved");

		var issueAssignees = template.querySelector('.issue-assignees span');
		issueAssignees.classList.contains('user') ? issueAssignees.classList.remove('user') : "";

		template.querySelector('.priority').setAttribute('title', issue.priority);
		template.querySelector('.issue-status').dataset.state = issue.state;
		template.querySelector('.issue-status .issue-status-label').innerHTML = issue.state;

		template.querySelector('.issue-id').innerHTML = "#"+issue.id;
		template.querySelector('.issue-date').innerHTML = issue.updated_html;
		template.querySelector('.issue-title').innerHTML = issue.title;
		template.querySelector('.issue-labels label').innerHTML = issue.kind;

		if(issue.assignee){
			issueAssignees.innerHTML = "@"+issue.assignee.username;
			issueAssignees.classList.add('user');
		}else{
			issueAssignees.innerHTML = "nobody";
		}

		return template.outerHTML;

	}


};

module.exports = obj;