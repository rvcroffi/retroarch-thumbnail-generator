const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { copyFile, readFile, readdir, writeFile } = require('fs').promises;
const cp = require('child_process');
// const { autoUpdater } = require('electron-updater');
'use strict';

if (process.env.NODE_ENV == 'development') {
  require('electron-reloader')(module);
  //Em DEV tem q declarar o id abaixo e clicar com o botão direito no arquivo node_modules\electron\dist\electron.exe 
  //e "fixar em iniciar" para notificação funcionar no windows10
  app.setAppUserModelId(process.execPath);
} else {
  app.setAppUserModelId("com.rvcroffi.retroarch-thumbnail-updater");
}

global.sharedObject = {
  handleError: handleError,
  sendMessage: sendMessage,
  sendQuestion: sendQuestion,
  openDirectory: openDirectory,
  readDirectory: readDirectory,
  loadPlaylist: loadPlaylist,
  resetPlaylist: resetPlaylist,
  matchFilenames: matchFilenames,
  saveImages: saveImages,
  // quitApp: quitApp,
  checkUpdates: checkUpdates,
  savePlaylist: savePlaylist,
  createAboutWindow: createAboutWindow
}

var mainWindow = null, loadedPlaylist = [];

function handleError(error) {
  let oError = {
    userMessage: '',
    error: null
  };
  if (error instanceof Error) {
    oError.userMessage = 'An internal application error has occurred';
    oError.error = error;
  } else {
    oError.userMessage = error;
  }
  sendMessage(oError.userMessage, 'Error', 'error');
  return oError;
}

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    // frame: false,
    // titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'assets', 'js', 'preload.js')
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile('index.html');

  mainWindow.on('close', (e) => {
    let ans = askQuitApp();
    if (ans !== 1) {
      e.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  // Open the DevTools.
  if (process.env.NODE_ENV == 'development') {
    mainWindow.webContents.openDevTools();
  }

  //console.log(`This platform is ${process.platform}`);
}

function createAboutWindow() {

  let aboutWindow = new BrowserWindow({
    width: 480,
    height: 340,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    parent: mainWindow,
    modal: true,
    show: false
  });

  aboutWindow.loadFile('./assets/html/about.html');
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
  });

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

function askQuitApp() {
  return sendQuestion('Close application?', 'Exit');
}

app.whenReady().then(createWindow);

// TODO Update config
// autoUpdater.autoDownload = false;
// autoUpdater.autoInstallOnAppQuit = false;
// autoUpdater.on('update-available', () => {
//   sendMessage('There is an update available', 'Warning', 'info');
// });
// autoUpdater.on('update-downloaded', () => {
//   sendMessage('Update downloaded', 'Warning', 'info');
// });
// function downloadUpdate() {
//   autoUpdater.downloadUpdate()
//     .catch((e) => {
//       handleError(e);
//     })
// }
// function quitAndInstall(){
//   autoUpdater.quitAndInstall(true, true);
// }
function checkUpdates() {
  //autoUpdater.checkForUpdates();
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function sendMessage(msg, title, type) {
  const dialogOpt = {
    type: type || 'none',//"none", "info", "error", "question", "warning"
    buttons: ['Ok'],
    title: title || 'Attention',
    message: msg
  };
  dialog.showMessageBox(mainWindow, dialogOpt);
}
function sendQuestion(msg, title, detail) {
  const dialogOpt = {
    type: 'question',//"none", "info", "error", "question", "warning"
    buttons: ['Cancel', 'Ok'],
    defaultId: 0,
    cancelId: 0,
    title: title || 'Attention',
    message: msg,
    detail: detail
  };
  return dialog.showMessageBoxSync(mainWindow, dialogOpt);
}

function openDirectory(path) {
  return dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: path
  });
}

function savePlaylist(playlist, title, path) {
  let selectedPath = dialog.showSaveDialogSync(mainWindow, {
    title: 'Save file',
    defaultPath: path || 'nothumblist.lpl',
    filters: [{ name: 'LPL File', extensions: ['lpl'] }]
  });
  if (selectedPath) {
    let newPlaylist = {
      name: title,
      items: playlist
    };
    try {
      let data = JSON.stringify(newPlaylist, null, 2);
      return writeFile(selectedPath, data)
        .then(() => true);
    } catch (e) {
      return Promise.reject(e);
    }
  } else {
    return Promise.resolve(false);
  }
}

function readDirectory(path) {
  return readdir(path, {
    withFileTypes: false
  });
}

function loadPlaylist(path) {
  return readFile(path, 'utf8')
    .then((result) => {
      let data;
      try {
        data = JSON.parse(result);
      } catch (e) {
        Promise.reject('Invalid playlist format');
      }
      if (data.items.length) {
        loadedPlaylist = data.items;
        resetPlaylist();
        return loadedPlaylist;
      } else {
        Promise.reject('No items in your playlist');
      }
    });
}

function resetPlaylist() {
  loadedPlaylist.forEach(item => {
    item.thumbnail = null;
  });
  return loadedPlaylist;
}

function matchFilenames(filelist, options) {
  return new Promise((resolve, reject) => {
    if (loadedPlaylist.length > 0) {
      try {
        const fuseprocess = cp.fork(path.join(app.getAppPath(), 'assets', 'js', 'fuseprocess.js'));
        fuseprocess.on('message', (resp) => {
          fuseprocess.kill();
          if (resp.err) {
            reject(resp.error);
          } else {
            resolve(resp.updatedPlaylist);
          }
        });
        fuseprocess.send({
          filelist: filelist,
          options: options,
          loadedPlaylist: loadedPlaylist
        });
      } catch (e) {
        reject(e);
      }
    } else {
      reject('Invalid Playlist File');
    }
  });
}

function saveImages(playlist, dirpath, callback) {
  try {
    let promises = Promise.resolve();
    playlist.forEach(element => {
      if (element.thumbnail) {
        let ext = element.thumbnail.name.substring(element.thumbnail.name.lastIndexOf('.'));
        let imagename = element.label.replace(/[&*/:`<>?\|]/g, '_') + ext;
        promises = promises.then(() => {
          if (typeof callback === 'function') callback();
          return copyFile(element.thumbnail.path, path.join(dirpath, imagename));
        });
      }
    });
    return promises;
  } catch (e) {
    return Promise.reject(e);
  }
}