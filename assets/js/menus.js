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
        sharedObject.createAboutWindow();
        // shell.openExternal('https://github.com');
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