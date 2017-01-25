// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// var bitbucket = require('node-bitbucket-api');

// new Notification('Hi!')

require('electron').ipcRenderer.on('repos', (event, message) => {
  console.log(message)  // Prints 'whoooooooh!'
})