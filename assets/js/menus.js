const { Menu, shell } = require('electron').remote;
const variables = require('./variables').variables;

function getMenus(sharedObject) {
  let infoMenu = Menu.buildFromTemplate([
    {
      label: 'How it works',
      click: () => {
        shell.openExternal(variables.howitworks_url);
      }
    },
    {
      label: 'Check updates',
      click: () => {
        sharedObject.checkUpdates();
      }
    },
    {
      label: 'About',
      click: () => {
        sharedObject.createAboutWindow();
      }
    },
    {
      type: 'separator'
    },
    {
      role: 'quit'
    }
  ]);

  return {
    infoMenu
  };
}


exports.getMenus = getMenus;