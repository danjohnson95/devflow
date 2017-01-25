const electron = require('electron')

const {shell, ipcMain} = require('electron')

const request = require('request')

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

var access_token = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1100, height: 700})

  // Is the user logged in?
  shell.openExternal('https://bitbucket.org/site/oauth2/authorize?client_id=XQZgdxhJ6B65Cnk3UQ&response_type=code');
  

  app.on('open-url', function(ev, callback){
    var code = callback.substring(10);
    request({
      url: 'https://bitbucket.org/site/oauth2/access_token',
      method:'post',
      auth: {
        user: "XQZgdxhJ6B65Cnk3UQ",
        pass: "EJ5UgWBpK2njZs73CJwWyVXGURJSxYA8"
      },
      form: {
        "grant_type": "authorization_code",
        "code": code
      }
    }, function(err, response, body){


      // This here gets their repos.
      var response = JSON.parse(body);
      access_token = response.access_token;
      request({
        url:'https://api.bitbucket.org/2.0/repositories?role=contributor',
        auth: {
          "bearer": response.access_token
        }
      }, function(err, response, body){
        mainWindow.webContents.send('repos', JSON.parse(body));
      });



      // and load the index.html of the app.
      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
      }));


    });
  });



  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

}

ipcMain.on('show-issues', (event, arg) => {

  console.log(arg);
  request({
    url:'https://api.bitbucket.org/2.0/repositories/'+arg+'/issues',
    auth: {
      "bearer": access_token
    }
  }, function(err, response, body){
    body = JSON.parse(body);
    body.repo_id = arg;
    mainWindow.webContents.send('issues', body);
  });

});

ipcMain.on('show-issue', (event, arg) => {

  console.log(arg);
  request({
    url:'https://api.bitbucket.org/2.0/repositories/'+arg,
    auth: {
      "bearer": access_token
    }
  }, function(err, response, body){
    mainWindow.webContents.send('issue', JSON.parse(body));
  })

});

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
