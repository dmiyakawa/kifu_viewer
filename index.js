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
    // Kifu-for-JSが要求するjqueryと衝突するらしいので、
    // node-interationをfalseにする。
    mainWindow = new BrowserWindow({width: 800,
                                    height: 600,
                                    'node-integration': false});
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
