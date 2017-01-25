// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// var bitbucket = require('node-bitbucket-api');

// new Notification('Hi!')

const {ipcRenderer} = require('electron')

var repoSidebar = document.getElementById('repo-sidebar'),
	repoButtonTemplate = repoSidebar.querySelector('.template');

repoButtonTemplate.classList.remove('template');

require('electron').ipcRenderer.on('repos', (event, message) => {
  console.log(message.values);
  message.values.forEach(function(e, i){
  	repoButtonTemplate.dataset.id = e.fullname;
  	repoButtonTemplate.innerHTML = e.name;
  	repoSidebar.innerHTML += repoButtonTemplate.outerHTML;
  });

  var sendRequest = function(){
  	ipcRenderer.send('show-issues', 'somethinglol');
  }

  var repoButtons = document.querySelectorAll('#repo-sidebar li');
  [].map.call(repoButtons, function(elem){
  	elem.addEventListener('click', sendRequest, false);
  });
});