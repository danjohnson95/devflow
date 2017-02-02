// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// var bitbucket = require('node-bitbucket-api');

// new Notification('Hi!')

const {ipcRenderer} = require('electron')

var newIssueModal = require('./browser/new-issue-modal.js'),
	repoList = require('./browser/repo-list.js'),
	issues = require('./browser/issues.js');

repoList.requestRepos();

require('electron').ipcRenderer.on('repos', (event, message) => {

  repoList.insertRepos(message.values);

}).on('issues', (event, message) => {

	issues.insertIssues(message.values);

	// Now, is the cache up to date?
	if(message.values.length){
		var cacheDate = new Date(message.values[0].cached_on).getTime();
		// If the cache is older than 5 mins, refresh it.
		if(new Date().getTime() - 300000 > cacheDate){
			ipcRenderer.send('refresh-issue-cache', {repo_slug: message.values[0].repository.full_name});
		}
	}

}).on('issue', (event, message) => {

	issues.insertAttachments(message.attachments);
	issues.insertComments(message.comments);

}).on('new-issue-created', (event, message) => {
	newIssueModal.closeAndClear();
	// Are we on the same repo as the one just inserted?
	if(repoList.getCurrentRepo() == message.repository.full_name){
		issues.prependIssue(message);
	}
}).on('loading', (event, message) => {
	console.log('loading');
	switch(message.box){
		case 0:
			break;
		case 1:
			issues.loading(message.state);
			break;
		case 2:
			issues.loadingContents(message.state);
			break;
	}
});

var newComment = document.getElementById('issue-new-comment');

newComment.addEventListener('click', function(){
	if(!this.classList.contains('open')){
		this.classList.add('open');
		this.querySelector('textarea').focus();
		setTimeout(function(){
			issues.calculateContentScrollHeight();
		}, 300);
	}
});

function hasParent(e, id){

	if(e.id == id){
		return true;
	}else{
		if(e.parentNode){
			return hasParent(e.parentNode, id);
		}else{
			return false;
		}
	}

}

document.addEventListener('click', function(e, elm){
	if(!hasParent(e.target, 'issue-new-comment')){
		if(newComment.classList.contains('open')) newComment.classList.remove('open');
		setTimeout(function(){
			issues.calculateContentScrollHeight();
		}, 300);
	}
});