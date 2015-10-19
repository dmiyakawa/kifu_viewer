'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');

require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
    app.quit();
});

app.on('ready', function() {
    console.log("started");
    mainWindow = new BrowserWindow({width: 800,
                                    height: 600,
                                    'min-width': 800,
                                    'min-height': 600});
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    mainWindow.openDevTools();
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
