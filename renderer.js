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

// issueListTemplate.classList.remove('template');
// issueCommentTemplate.classList.remove('template');
// issueList.innerHTML = "";
// issueComments.innerHTML = "";

repoList.requestRepos();

require('electron').ipcRenderer.on('repos', (event, message) => {

  repoList.insertRepos(message.values);

}).on('issues', (event, message) => {

	issues.insertIssues(message.values);

}).on('issue', (event, message) => {

	issues.insertAttachments(message.attachments);
	issues.insertComments(message.comments);

}).on('new-issue-created', (event, message) => {
	newIssueModal.closeAndClear();
	// Are we on the same repo as the one just inserted?
	console.log(repoList.getCurrentRepo());
	if(repoList.getCurrentRepo() == message.repository.full_name){
		issues.prependIssue(message);
	}
}).on('loading', (event, message) => {
	console.log(message);
	switch(message.box){
		case 0:
			break;
		case 1:
			issues.loading(message.state);
			break;
		case 2:
			break;
	}
})