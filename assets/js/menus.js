const { Menu, shell } = require('electron').remote;

function getMenus(sharedObject) {
  let infoMenu = Menu.buildFromTemplate([
    {
      label: 'How it works',
      click: () => {
        // shell.openExternal('https://github.com');
      }
    },
    // {
    //   label: 'Check updates',
    //   click: () => {
    //     sharedObject.checkUpdates();
    //   }
    // },
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