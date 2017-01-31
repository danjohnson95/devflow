// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// var bitbucket = require('node-bitbucket-api');

// new Notification('Hi!')

const {ipcRenderer} = require('electron')

var repoSidebar = document.getElementById('repo-sidebar'),
	repoButtonTemplate = repoSidebar.querySelector('.template'),
	issueListOuter = document.getElementById('issue-list'),
	issueList = document.getElementById('issue-list-inner'),
	issueListTemplate = issueList.querySelector('.template'),
	issueContents = document.getElementById('issue-contents'),
	issueComments = document.getElementById('issue-comments'),
	issueCommentTemplate = issueComments.querySelector('.template');

var newIssueModal = require('./browser/new-issue-modal.js'),
	repoList = require('./browser/repo-list.js'),
	issues = require('./browser/issues.js');

issueListTemplate.classList.remove('template');
issueCommentTemplate.classList.remove('template');
issueList.innerHTML = "";
issueComments.innerHTML = "";

repoList.requestRepos();

require('electron').ipcRenderer.on('repos', (event, message) => {

  repoList.insertRepos(message.values);

}).on('issues', (event, message) => {

	issues.insertIssues(message.values);

}).on('issue', (event, message) => {
	
	console.log(message);
	
	if(message.attachments.length < 1){
		!issueContents.querySelector('#issue-description .attachments').classList.contains('hide') ? issueContents.querySelector('#issue-description .attachments').classList.add('hide') : "";	
		return;
	}
	var html = "";
	message.attachments.forEach(function(e, i){
		html += "<div data-src='"+e.links.self.href[0]+"'>"+e.name+"</div>";
	});
	issueContents.querySelector('#issue-description .attachments div').innerHTML = html;
	issueContents.querySelector('#issue-description .attachments').classList.contains('hide') ? issueContents.querySelector('#issue-description .attachments').classList.remove('hide') : "";


}).on('comments', (event, message) => {
	console.log(message);
	issueComments.innerHTML = "";
	if(message.values.length < 1) return;
	message.values.forEach(function(e, i){
		if(e.content.html == "") return;
		issueCommentTemplate.querySelector('.issue-user img').setAttribute('src', e.user.links.avatar.href);
		issueCommentTemplate.querySelector('.issue-user .user-name').innerHTML = e.user.display_name;
		issueCommentTemplate.querySelector('.issue-user .posted-time').innerHTML = e.created_html;
		issueCommentTemplate.querySelector('p.issue-content').innerHTML = e.content.html;

		issueComments.innerHTML += issueCommentTemplate.outerHTML;
	});

}).on('new-issue-created', (event, message) => {
	newIssueModal.closeAndClear();
	// Are we on the same repo as the one just inserted?
	console.log(repoList.getCurrentRepo());
	if(repoList.getCurrentRepo() == message.repository.full_name){
		issues.prependIssue(message);
	}
});