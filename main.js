const { app, BrowserWindow, Tray, Menu, globalShortcut, dialog } = require('electron');
const path = require('path');
const { readFileSync } = require('fs');
const { copyFile, readFile, readdir } = require('fs').promises;
// const Fuse = require('fuse.js');
const cp = require('child_process');
// const zlib = require('zlib');

if (process.env.NODE_ENV == 'development') {
  require('electron-reloader')(module);
  //Em DEV tem q declarar o id abaixo e clicar com o botão direito no arquivo node_modules\electron\dist\electron.exe 
  //e "fixar em iniciar" para notificação funcionar no windows10
  app.setAppUserModelId(process.execPath);
} else {
  app.setAppUserModelId("com.rvcroffi.retroarch-thumbnail-updater");
}

global.sharedObject = {
  sendMessage: sendMessage,
  openDirectory: openDirectory,
  readDirectory: readDirectory,
  loadPlaylist: loadPlaylist,
  matchFilenames: matchFilenames,
  saveImages: saveImages
}

var mainWindow = null, loadedPlaylist = [];

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'js', 'preload.js')
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

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
  dialog.showMessageBox(dialogOpt);
}

function openDirectory() {
  return dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
}

function readDirectory(path) {
  return readdir(path, {
    withFileTypes: false
  });
}

function loadPlaylist(path) {
  return readFile(path, 'utf8')
    .then((result) => {
      const data = JSON.parse(result);
      if (data.items.length) {
        data.items.forEach(item => {
          item.thumbnail = null;
        });
        loadedPlaylist = data.items;
        return data.items.slice();
      } else {
        throw new Error();
      }
    });
}

function matchFilenames(filelist, options) {
  return new Promise((resolve, reject) => {
    if (loadedPlaylist.length > 0) {
      try {
        const fuseprocess = cp.fork(path.join(app.getAppPath(), 'js', 'fuseprocess.js'));
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
      reject('Invalid Playlist File', 'Error', 'error');
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