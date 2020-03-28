const { remote } = require('electron');
// const { readFileSync } = require('fs');

const sharedObject = remote.getGlobal('sharedObject');

window.appApi = {
  currWindow: remote.BrowserWindow.getFocusedWindow(),
  sendMessage: sharedObject.sendMessage,
  loadPlaylist: sharedObject.loadPlaylist,
  matchFilenames: sharedObject.matchFilenames
};
// window.readConfig = function () {
//   const data = readFileSync('./config.json')
//   return data
// }