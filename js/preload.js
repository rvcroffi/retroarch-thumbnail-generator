const { remote } = require('electron');

const sharedObject = remote.getGlobal('sharedObject');

window.appApi = {
  currWindow: remote.BrowserWindow.getFocusedWindow(),
  handleError: sharedObject.handleError,
  sendMessage: sharedObject.sendMessage,
  openDirectory: sharedObject.openDirectory,
  readDirectory: sharedObject.readDirectory,
  loadPlaylist: sharedObject.loadPlaylist,
  matchFilenames: sharedObject.matchFilenames,
  saveImages: sharedObject.saveImages,
  quitApp: sharedObject.quitApp,
  showInfoMenu: showInfoMenu
};

const infoMenu = remote.Menu.buildFromTemplate([
  {
    label: 'Check updates',
    click: () => {
      sharedObject.checkUpdates();
    }
  },
  {
    label: 'About',
    click: () => {
      remote.shell.openExternal('https://github.com');
    }
  }
]);
function showInfoMenu() {
  infoMenu.popup();
}