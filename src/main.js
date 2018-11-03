/**
 * Created by zc1415926 on 2017/5/15.
 */
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const url = require('url');
const xlsx = require('node-xlsx');
const fs = require('fs');
const shelljs = require('shelljs');

<!-- build:remove -->
<!-- Connect to server process -->
const client = require('electron-connect').client;
<!-- endbuild -->

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let targetDirPath;
let sourceData;
let skipRowCount;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({width: 800, height: 600,
        frame: false, resizable: false});

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app', 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.setMenu(null);

    <!-- build:remove -->
    <!-- Connect to server process -->
    client.create(win);
    // Open the DevTools.
  //  win.webContents.openDevTools();
    <!-- endbuild -->

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('open-target-dir', function (event) {
    dialog.showOpenDialog({
            title: '打开目标文件夹',
            properties: ['openDirectory']
        },

        function (dirPaths) {
            if(!dirPaths){
                console.log('locate target dir canceled');
            }
            else{
                console.log('target dir: ' + dirPaths);
                targetDirPath = dirPaths;
                shelljs.cd(targetDirPath);
                let fileCount = shelljs.ls('*').length;
                event.sender.send('target-dir-reply', dirPaths, fileCount);
            }
        }
    );
});

ipcMain.on('open-excel-path', function (event) {
    dialog.showOpenDialog({
            title: '打开参照Excel文件',
            filters: [{name: '电子表格', extensions: ['xls', 'xlsx']},
                {name: 'All Files', extensions: ['*']}],
            properties: ['openFile']
        },
        function (filePath) {
            if(!filePath){
                console.log('locate excel canceled');
            }
            else {
                console.log('excel file: ' + filePath);

                sourceData = xlsx.parse(fs.readFileSync(filePath.toString()))[0]['data'];
                event.sender.send('excel-path-reply', filePath, sourceData.length);
            }
    });
});

ipcMain.on('get-col-header', function (event, num) {
    console.log(sourceData[num-1]);
    skipRowCount = num;
    event.sender.send('col-header-reply', sourceData[num-1]);
});

ipcMain.on('start-to-rename', function (event, sourceColNum, targetColNum) {
    //check the 5 items: targetDirPath, sourceData, skipRowCount, sourceColNum, targetColNum

    let errorMessage = [];

    if(!targetDirPath){
        errorMessage.push(' 目标文件夹没有选择');
    }
    if(!sourceData){
        errorMessage.push(' Excel文件没有选择');
    }
    if(!skipRowCount){
        errorMessage.push(' 列标题所在列有选择');
    }
    if(sourceColNum == -1){
        errorMessage.push(' 原文件名列没有选择');
    }
    if(targetColNum == -1){
        errorMessage.push(' 目标文件名列没有选择');
    }

    if(errorMessage.length > 0){
        console.log('errorMessage');
        console.log(errorMessage);
        event.sender.send('rename-error-reply', errorMessage);

        return;
    }
    shelljs.cd(targetDirPath);
 
    for(let rowI=skipRowCount; rowI < sourceData.length; rowI++){

        let currentRow = sourceData[rowI];
        let matchedFiles = shelljs.ls('*' + currentRow[sourceColNum] + '.*');

        if(matchedFiles.length == 1){
            let oldFileName = matchedFiles.toString();
            let newFileName = oldFileName.replace(currentRow[sourceColNum], currentRow[targetColNum]);

            shelljs.mv(oldFileName, newFileName);

            event.sender.send('start-to-rename-reply',
                '“'+oldFileName+'” 重命名为 “'+newFileName+'”');
        }else if(matchedFiles.length == 0){
            event.sender.send('start-to-rename-reply', '没有找到文件名包含“' + sourceData[rowI][sourceColNum] + '”的文件');
        }
    }
});

ipcMain.on('close-app', function () {
    win.close();
});

ipcMain.on('open-music', (event) => {
    dialog.showOpenDialog({
            title: '打开音乐文件',
            filters: [{name: '音乐文件', extensions: ['mp3', 'wav']},
                {name: 'All Files', extensions: ['*']}],
            properties: ['openFile']
        },
        function (filePath) {
            if(!filePath){
                console.log('locate music canceled');
            }
            else {
                console.log('music file: ' + filePath);

                event.sender.send('open-music-reply', filePath);
            }
        });
});