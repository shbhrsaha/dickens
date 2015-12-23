'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 900, 
    height: 700,
    resizable: false,
    'title-bar-style': 'hidden'
  });

  mainWindow.loadURL('file://' + __dirname + '/html/index.html');

  mainWindow.on('closed', function() {
    app.quit();
  });
});
