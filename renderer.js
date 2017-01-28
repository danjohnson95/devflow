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

repoButtonTemplate.classList.remove('template');
issueListTemplate.classList.remove('template');
issueCommentTemplate.classList.remove('template');
repoSidebar.innerHTML = "";
issueList.innerHTML = "";
issueComments.innerHTML = "";

console.log('ready for listening!!!');

require('electron').ipcRenderer.on('repos', (event, message) => {
	console.log('yo');
	console.log(message);
  repoSidebar.innerHTML = "";
  message.values.forEach(function(e, i){
  	repoButtonTemplate.dataset.id = e.full_name;
  	repoButtonTemplate.innerHTML = e.name;
  	repoSidebar.innerHTML += repoButtonTemplate.outerHTML;
  });

  var repoButtons = document.querySelectorAll('#repo-sidebar li');
  [].map.call(repoButtons, function(elem){
  	elem.addEventListener('click', function(){
  		repoButtons.forEach(function(e, i){
  			e.classList.contains('active') ? e.classList.remove('active') : "";
  		});
  		!elem.classList.contains('active') ? elem.classList.add('active') : "";
  		ipcRenderer.send('show-issues', elem.dataset.id);
  	});
  });

}).on('issues', (event, message) => {
	!issueListOuter.querySelector('#placeholder').classList.contains('hide') ? issueListOuter.querySelector('#placeholder').classList.add('hide') : "";
	issueContents.querySelector('#placeholder').classList.contains('hide') ? issueContents.querySelector('#placeholder').classList.remove('hide') : "";
	issueList.innerHTML = "";
	console.log(message);
	message.values.forEach(function(e, i){
		issueListTemplate.dataset.id = message.repo_id+"/issues/"+e.id;
		issueListTemplate.querySelector('.priority').dataset.priority = e.priority;
		issueListTemplate.querySelector('.issue-status').dataset.state = e.state;
		issueListTemplate.querySelector('.issue-status .issue-status-label').innerHTML = e.state;
		issueListTemplate.querySelector('.issue-id').innerHTML = "#"+e.id;
		issueListTemplate.querySelector('.issue-date').innerHTML = e.updated_html;
		issueListTemplate.querySelector('.issue-title').innerHTML = e.title;
		issueListTemplate.querySelector('.issue-labels label').innerHTML = e.kind;
		if(e.assignee){
			issueListTemplate.querySelector('.issue-assignees span').innerHTML = "@"+e.assignee.username;
			!issueListTemplate.querySelector('.issue-assignees span').classList.contains('user') ? issueListTemplate.querySelector('.issue-assignees span').classList.add('user') : "";
		}else{
			issueListTemplate.querySelector('.issue-assignees span').innerHTML = "nobody";
			issueListTemplate.querySelector('.issue-assignees span').classList.contains('user') ? issueListTemplate.querySelector('.issue-assignees span').classList.remove('user') : "";
		}
		issueList.innerHTML += issueListTemplate.outerHTML;
	});

	var issueButtons = document.querySelectorAll('#issue-list-inner .issue-box');
	[].map.call(issueButtons, function(elem){
		elem.addEventListener('click', function(){
			issueButtons.forEach(function(e, i){
				e.classList.contains('active') ? e.classList.remove('active') : "";
			});
			!elem.classList.contains('active') ? elem.classList.add('active') : "";
			ipcRenderer.send('show-issue', elem.dataset.id);
		});
	});

}).on('issue', (event, message) => {
	!issueContents.querySelector('#placeholder').classList.contains('hide') ? issueContents.querySelector('#placeholder').classList.add('hide') : "";
	console.log(message);
	issueContents.querySelector('.issue-id').innerHTML = "#"+message.id;
	issueContents.querySelector('#issue-title').innerHTML = message.title;
	issueContents.querySelector('#issue-labels label').innerHTML = message.kind;
	issueContents.querySelector('#issue-contents-details .vote-and-watch .vote span').innerHTML = message.votes;
	issueContents.querySelector('#issue-contents-details .vote-and-watch .watch span').innerHTML = message.watches;
	issueContents.querySelector('#issue-description .issue-user img').setAttribute('src', message.reporter.links.avatar.href);
	issueContents.querySelector('#issue-description .user-name').innerHTML = message.reporter.display_name;
	issueContents.querySelector('#issue-description .posted-time').innerHTML = message.created_html;
	issueContents.querySelector('#issue-description p.issue-content').innerHTML = message.content.html;

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

});