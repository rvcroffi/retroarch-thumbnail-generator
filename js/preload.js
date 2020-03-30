const { remote } = require('electron');
// const { readFileSync } = require('fs');

const sharedObject = remote.getGlobal('sharedObject');

window.appApi = {
  currWindow: remote.BrowserWindow.getFocusedWindow(),
  handleError: sharedObject.handleError,
  sendMessage: sharedObject.sendMessage,
  openDirectory: sharedObject.openDirectory,
  readDirectory: sharedObject.readDirectory,
  loadPlaylist: sharedObject.loadPlaylist,
  matchFilenames: sharedObject.matchFilenames,
  saveImages: sharedObject.saveImages
};
// window.readConfig = function () {
//   const data = readFileSync('./config.json')
//   return data
// }