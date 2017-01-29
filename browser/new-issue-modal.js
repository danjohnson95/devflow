const {ipcRenderer} = require('electron'),
	modal = document.getElementById('new-issue-modal'),
	overlay = document.getElementById('modal-background'),
	newIssueBtn = document.getElementById('new-issue-btn'),
	submitIssue = modal.querySelector('.submit-new-issue button'),
	newIssueRepos = document.getElementById('new-issue-repo-select'),
	titleInput = modal.querySelector('input.title-input'),
	bodyInput = modal.querySelector('textarea.body-input');


var obj = {

	close: function(){
		overlay.opacity = 0;
		modal.style.transform = "translate3d(0, 300px, 0)";
		modal.style.opacity = 0;
		setTimeout(function(){
			overlay.style.display = "none";
			modal.style.display = "none";
		}, 300);
	},

	setRepos: function(repos){
		newIssueRepos.innerHTML = "";
		repos.forEach(function(e, i){
			newIssueRepos.innerHTML += "<option>"+e.full_name+"</option>";
		});
	},

	setCurrentRepo: function(repo){
		newIssueRepos.value = repo;
	},

	handleInput: function(){
		if(this.value == "" && !submitIssue.classList.contains('disabled')){
			submitIssue.classList.add('disabled');
		}else if(this.value != "" && submitIssue.classList.contains('disabled')){
			submitIssue.classList.remove('disabled');
		}
	},

	applyPositioning: function(){
		var width = modal.offsetWidth,
			height = modal.offsetHeight;
		//console.log(window.innerWidth);
		modal.style.left = (window.innerWidth - modal.offsetWidth) / 2+"px";
		modal.style.top = (window.innerHeight - modal.offsetHeight) / 2+"px";
	},

	open: function(){
		overlay.style.display = "block";
		modal.style.display = "block";
		obj.applyPositioning();
		setTimeout(function(){
			modal.style.transform = "translate3d(0, 0, 0)";
			modal.style.opacity = 1;
		}, 100);
		setTimeout(function(){
			overlay.style.opacity = 1;
		}, 10);
	},

	submit: function(){
		if(this.classList.contains('disabled')) return;
		this.classList.add('disabled');
		this.innerHTML = "Loading...";
		ipcRenderer.send('new-issue', {
			repo: newIssueRepos.value,
			title: titleInput.value,
			body: bodyInput.value
		});
	},

	closeAndClear: function(){
		obj.close();
		titleInput.value = "";
		bodyInput.value = "";
		newIssueBtn.classList.add('disabled');
	}

};

obj.applyPositioning();

// TODO: Also apply positioning on resize.

newIssueBtn.addEventListener('click', obj.open);
overlay.addEventListener('click', obj.close);
titleInput.addEventListener('input', obj.handleInput);
submitIssue.addEventListener('click', obj.submit);

module.exports = obj;