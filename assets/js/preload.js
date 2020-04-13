const { remote } = require('electron');
const menus = require('./menus');

const sharedObject = remote.getGlobal('sharedObject');
const customMenus = menus.getMenus(sharedObject);

window.appApi = {
  currWindow: remote.BrowserWindow.getFocusedWindow(),
  handleError: sharedObject.handleError,
  sendMessage: sharedObject.sendMessage,
  sendQuestion: sharedObject.sendQuestion,
  openDirectory: sharedObject.openDirectory,
  readDirectory: sharedObject.readDirectory,
  loadPlaylist: sharedObject.loadPlaylist,
  resetPlaylist: sharedObject.resetPlaylist,
  matchFilenames: sharedObject.matchFilenames,
  saveImages: sharedObject.saveImages,
  // quitApp: sharedObject.quitApp,
  savePlaylist: sharedObject.savePlaylist,
  getAppVersion: sharedObject.getAppVersion,
  showInfoMenu: showInfoMenu
};

function showInfoMenu() {
  customMenus.infoMenu.popup();
}