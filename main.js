const electron = require('electron')

const {shell, ipcMain} = require('electron')

const request = require('request')

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const storage = require('electron-json-storage')

const BitBucket = require('./bitbucket.js');

var access_token = null;

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
  storage.get('config', function(err, config){
    if(Object.keys(config).length === 0 && config.constructor === Object){
      //
      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'login.html'),
        protocol: 'file:',
        slashes: true
      }));

      ipcMain.on('open-bitbucket', function(){
        shell.openExternal(BitBucket.getAuthenticateURL());
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

    // First, get cached repos. Then we'll connect afterward.
    storage.get('repos', (err, repos) => {
      if(Object.keys(repos).length > 0){
        console.log('GOT CACHE!!');

        //console.log(mainWindow.webContents.send('repos', {"test":"hey"}));
        //console.log(mainWindow);
        mainWindow.webContents.send('repos', repos);
      }

    });

    mainWindow.webContents.send('loading-start', {box: 0});

    BitBucket.getRepos(function(err, repos){
      console.log('Got from network');
      mainWindow.webContents.send('repos', repos);
      mainWindow.webContents.send('loading-stop', {box: 0});
    });

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

ipcMain.on('show-issues', (event, arg) => {

  BitBucket.getIssues(arg, function(err, issues){
    mainWindow.webContents.send('issues', issues);
  });

});

ipcMain.on('show-issue', (event, arg) => {

  console.log(arg);

  BitBucket.getIssue(arg, function(err, issue){
    mainWindow.webContents.send('issue', issue);
  });

  BitBucket.getIssueAttachments(arg, function(err, attachments){
    mainWindow.webContents.send('attachments', attachments);
  });

  BitBucket.getIssueComments(arg, function(err, comments){
    mainWindow.webContents.send('comments', comments);
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
