const modal = document.getElementById('new-issue-modal'),
	overlay = document.getElementById('modal-background'),
	newIssueBtn = document.getElementById('new-issue-btn'),
	newIssueRepos = document.getElementById('new-issue-repo-select');


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
	}

};

obj.applyPositioning();

// TODO: Also apply positioning on resize.

newIssueBtn.addEventListener('click', obj.open);
overlay.addEventListener('click', obj.close);

module.exports = obj;