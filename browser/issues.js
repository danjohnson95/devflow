const {ipcRenderer} = require('electron'),
	issueListOuter = document.getElementById('issue-list'),
	issueList = issueListOuter.querySelector('#issue-list-inner'),
	issueContents = document.getElementById('issue-contents'),
	template = issueList.querySelector('.template'),
	issueListPlaceholder = issueListOuter.querySelector('.placeholder'),
	issueContentsPlaceholder = issueContents.querySelector('.placeholder'),
	contentsVoteWatch = issueContents.querySelector('#issue-contents-details .vote-and-watch'),
	contentsDescription = issueContents.querySelector('#issue-description'),
	timeAgo = require('../timeago.js');
	

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

	showIssueListPlaceholder: function(){
		issueListPlaceholder.innerHTML = "Select a repo to begin";
		issueListPlaceholder.classList.contains('hide') ? issueListPlaceholder.classList.remove('hide') : "";
	},

	hideEmptyIssues: function(){
		obj.hideIssueListPlaceholder();
	},

	showEmptyIssues: function(){
		issueListPlaceholder.innerHTML = "No issues here!";
		issueListPlaceholder.classList.contains('hide') ? issueListPlaceholder.classList.remove('hide') : "";
	},

	insertIssues: function(issues){
		obj.clearList();
		obj.showIssueContentsPlaceholder();
		obj.hideIssueListPlaceholder();
		if(!issues || !issues.length){
			obj.showEmptyIssues();
		}else{
			obj.hideEmptyIssues();
			issues.forEach(function(e){
				issueList.innerHTML += obj.generateNewIssueBlockHTML(e);
			});
		}
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

	showBareDetails: function(elem){
		// TODO: Show the bare details we already have in the contents box.
		!issueContents.querySelector('.placeholder').classList.contains('hide') ? issueContents.querySelector('.placeholder').classList.add('hide') : "";

		issueContents.querySelector('.issue-id').innerHTML = "#"+elem.dataset.id;
		issueContents.querySelector('#issue-title').innerHTML = elem.querySelector('.issue-title').innerHTML;
		issueContents.querySelector('#issue-labels label').innerHTML = elem.querySelector('.issue-labels label').innerHTML;
		issueContents.querySelector('#issue-labels label').dataset.kind = elem.dataset.issue_kind;



		contentsVoteWatch.querySelector('.vote span').innerHTML = elem.dataset.votes;
		contentsVoteWatch.querySelector('.watch span').innerHTML = elem.dataset.watches;
		
		contentsDescription.querySelector('.issue-user img').setAttribute('src', elem.dataset.author_img);
		contentsDescription.querySelector('.user-name').innerHTML = elem.dataset.author_name;
		contentsDescription.querySelector('.posted-time').innerHTML = timeAgo.html(elem.dataset.created_on);
		contentsDescription.querySelector('p.issue-content').innerHTML = JSON.parse(elem.dataset.content) != "" ? JSON.parse(elem.dataset.content) : "<em>No description</em>";
	},

	clickIssue: function(elem){
		var elem = this;
		if(elem.classList.contains('active')) return;
		obj.makeAllLinksInactive();
		elem.classList.add('active');
		obj.showBareDetails(elem);
		// obj.requestOneIssue({
		// 	repo_id: elem.dataset.repo_id,
		// 	issue_id: elem.dataset.id,
		// 	repo_slug: elem.dataset.repo_slug
		// });
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
		template.dataset.author_img = issue.reporter.links.avatar.href;
		template.dataset.author_name = issue.reporter.display_name;
		template.dataset.created_on = issue.created_on;
		template.dataset.votes = issue.votes;
		template.dataset.watches = issue.watches;
		template.dataset.content = JSON.stringify(issue.content.html);

		var issueAssignees = template.querySelector('.issue-assignees span');
		issueAssignees.classList.contains('user') ? issueAssignees.classList.remove('user') : "";

		template.querySelector('.priority').setAttribute('title', issue.priority);
		template.querySelector('.issue-status').dataset.state = issue.state;
		template.querySelector('.issue-status .issue-status-label').innerHTML = issue.state;

		template.querySelector('.issue-id').innerHTML = "#"+issue.id;
		template.querySelector('.issue-date').innerHTML = issue.updated_html;
		template.querySelector('.issue-title').innerHTML = issue.title;
		template.querySelector('.issue-labels label').innerHTML = issue.kind;

		console.log(issue);

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