// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// var bitbucket = require('node-bitbucket-api');

// new Notification('Hi!')

const {ipcRenderer} = require('electron')

var repoSidebar = document.getElementById('repo-sidebar'),
	repoButtonTemplate = repoSidebar.querySelector('.template'),
	issueList = document.getElementById('issue-list-inner'),
	issueListTemplate = issueList.querySelector('.template');

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

  var sendRequest = function(id){
  	ipcRenderer.send('show-issues', id);
  }

  var repoButtons = document.querySelectorAll('#repo-sidebar li');
  [].map.call(repoButtons, function(elem){
  	elem.addEventListener('click', function(){
  		sendRequest(elem.dataset.id);
  	});
  });
}).on('issues', (event, message) => {
	issueList.innerHTML = "";
	console.log(message);
	message.values.forEach(function(e, i){
		issueListTemplate.dataset.id = e.id;
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
});