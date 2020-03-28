const { app, BrowserWindow, Tray, Menu, globalShortcut, dialog } = require('electron');
const path = require('path');
const { readFileSync } = require('fs');
const Fuse = require('fuse.js');

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
  loadPlaylist: loadPlaylist,
  matchFilenames: matchFilenames
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

function loadPlaylist(path) {
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (data.items.length) {
      loadedPlaylist = data.items.slice();
      return data.items;
    } else {
      throw new Error();
    }
  } catch (e) {
    sendMessage('Invalid Playlist File', 'Error', 'error');
    loadedPlaylist = [];
    return [];
  }
}

function matchFilenames(filelist, options) {
  if (loadedPlaylist.length > 0) {
    let fuse = new Fuse(filelist, options);
    let updatedPlaylist = loadedPlaylist.map((item) => {
      let new_item = {
        label: item.label,
        path: item.path
      };
      let result = fuse.search(item.label);
      if (result.length > 0) {
        //result[0] is the item with best match score
        new_item.thumbnail = {
          name: result[0].item.name,
          path: result[0].item.path,
          score: result[0].score,
        };
      } else {
        new_item.no_thumb = true;
      }
      return new_item;
    });
    return updatedPlaylist;
  } else {
    sendMessage('Invalid Playlist File', 'Error', 'error');
  }
}