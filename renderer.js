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
	!issueContents.querySelector('.placeholder').classList.contains('hide') ? issueContents.querySelector('.placeholder').classList.add('hide') : "";
	console.log(message);
	issueContents.querySelector('.issue-id').innerHTML = "#"+message.id;
	issueContents.querySelector('#issue-title').innerHTML = message.title;
	issueContents.querySelector('#issue-labels label').innerHTML = message.kind;
	issueContents.querySelector('#issue-contents-details .vote-and-watch .vote span').innerHTML = message.votes;
	issueContents.querySelector('#issue-contents-details .vote-and-watch .watch span').innerHTML = message.watches;
	issueContents.querySelector('#issue-description .issue-user img').setAttribute('src', message.reporter.links.avatar.href);
	issueContents.querySelector('#issue-description .user-name').innerHTML = message.reporter.display_name;
	issueContents.querySelector('#issue-description .posted-time').innerHTML = message.created_html;
	issueContents.querySelector('#issue-description p.issue-content').innerHTML = message.content.html != "" ? message.content.html : "<em>No description</em>";

}).on('attachments', (event, message) => {
	// TODO: Ensure that we're putting this inside the correct issue. It might've changed in the time it took for this one to come in.
	if(message.values.length < 1){
		!issueContents.querySelector('#issue-description .attachments').classList.contains('hide') ? issueContents.querySelector('#issue-description .attachments').classList.add('hide') : "";	
		return;
	}
	var html = "";
	message.values.forEach(function(e, i){
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
	if(currentRepo == message.repo_id){
		console.log('Add new repo');
	}
});