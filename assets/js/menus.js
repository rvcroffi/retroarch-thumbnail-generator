const { Menu, shell } = require('electron').remote;

function getMenus(sharedObject) {
  let infoMenu = Menu.buildFromTemplate([
    {
      label: 'Check updates',
      click: () => {
        sharedObject.checkUpdates();
      }
    },
    {
      label: 'About',
      click: () => {
        shell.openExternal('https://github.com');
      }
    }
  ]);

  return {
    infoMenu
  };
}


exports.getMenus = getMenus;