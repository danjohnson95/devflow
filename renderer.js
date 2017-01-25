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
	issueContents = document.getElementById('issue-contents');

repoButtonTemplate.classList.remove('template');
issueListTemplate.classList.remove('template');
repoSidebar.innerHTML = "";
issueList.innerHTML = "";

require('electron').ipcRenderer.on('repos', (event, message) => {
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
		issueListTemplate.querySelector('.issue-id').innerHTML = "#"+e.id;
		issueListTemplate.querySelector('.issue-date').innerHTML = e.updated_on;
		issueListTemplate.querySelector('.issue-title').innerHTML = e.title;
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
	issueContents.querySelector('.issue-description img').setAttribute('src', message.reporter.links.avatar.href);
	issueContents.querySelector('.issue-description .user-name').innerHTML = message.reporter.display_name;
	issueContents.querySelector('.issue-description .posted-time').innerHTML = message.created_on;
	issueContents.querySelector('.issue-description p.issue-content').innerHTML = message.content.html;

});