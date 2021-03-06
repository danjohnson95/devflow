const electron = require('electron')

const {shell, ipcMain} = require('electron')

const request = require('request')

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const BitBucket = require('./bitbucket.js');

var access_token = null;

const cache = require('./cache.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    titleBarStyle: "hidden-inset"
  })

  //Do we have the access token in the cache?
  cache.config.find({type: 'access_token'}, function(err, token){
    if(!token.length){

      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'login.html'),
        protocol: 'file:',
        slashes: true
      }));

      ipcMain.on('open-bitbucket', function(){
        shell.openExternal(BitBucket.getAuthenticateURL());
      });

      ipcMain.on('bitbucket-code', function(e, code){
        //BitBucket.setRefreshToken(code, function(){
          BitBucket.requestAccessToken(code, function(){
            launchApp();
          });
        //});
      });

    }else{
      launchApp();
    }
  });

  function launchApp(access_token){

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

  }


  app.on('open-url', function(ev, callback){

    BitBucket.setRefreshToken(callback.substring(10), function(){
      BitBucket.requestAccessToken(function(){
        launchApp();
      });
    });

  });

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

}

ipcMain.on('new-issue', (event, arg) => {

  BitBucket.postNewIssue(arg, function(err, done){
    mainWindow.webContents.send('new-issue-created', done);
  });

});

ipcMain.on('new-comment', (event, arg) => {
  BitBucket.postNewComment(arg, function(err, done){
    mainWindow.webContents.send('new-comment-created', done);
  });
});

ipcMain.on('show-repos', (event, arg) => {
  // If we've got any cached, get them. Otherwise request from API.
  cache.repo.find({}, function(err, repos){
    if(repos.length){

      repos = {values: repos};
      mainWindow.webContents.send('repos', repos);

    }else{

      BitBucket.getRepos(function(err, repos){
        mainWindow.webContents.send('repos', repos);
      });

    }

  });
});

function RefreshIssueCache(repo_slug, callback){

    mainWindow.webContents.send('loading', {
      box: 1,
      state: 1
    });

    BitBucket.getIssues(repo_slug, function(err, issues){

      mainWindow.webContents.send('loading', {
        box: 1,
        state: 0
      });

      callback(err, issues);

    });

}

ipcMain.on('show-issues', (event, arg) => {

  cache.issues.find({repo_id: arg.repo_id}, function(err, issues){
    if(issues.length){
      issues = {values: issues, repo_id: arg};
      mainWindow.webContents.send('issues', issues);
    }else{
      RefreshIssueCache(arg.repo_slug, function(err, issues){
        mainWindow.webContents.send('issues', issues);
      });
    }

  });

});

ipcMain.on('refresh-issue-cache', (event, arg) => {

  RefreshIssueCache(arg.repo_slug, function(err, issues){
    mainWindow.webContents.send('issues', issues);
  });

});

ipcMain.on('show-issue', (event, arg) => {

  // Before this used to show the issue contents, but we already have it now!
  // So here we're just gonna be pulling out the attachments and comments.

  cache.issue.findOne({repo_id: arg.repo_id, issue_id: parseInt(arg.issue_id)}, function(err, issue){

	var cacheDate = 0;
  var now = new Date;

    if(issue){
      mainWindow.webContents.send('issue', issue);
	   cacheDate = new Date(issue.cached_on || 0);
    }

    // Refresh the cache if it's older than 5 minutes.
    if(!issue || now.getTime() - 300000 > cacheDate){

      mainWindow.webContents.send('loading', {
        box: 2,
        state: 1
      });

      BitBucket.getIssueDetail(arg.repo_slug, arg.repo_id, arg.issue_id, function(err, issue){
        mainWindow.webContents.send('issue', issue);

        mainWindow.webContents.send('loading', {
          box: 2,
          state: 0
        });

      });

    }

  });
});

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

if (shouldQuit) {
  app.quit()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
      createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.setAsDefaultProtocolClient("devflow");
