const { Menu, shell } = require("electron").remote;
const variables = require("./variables").variables;

function getMenus(sharedObject) {
  const infoMenu = Menu.buildFromTemplate([
    {
      label: "How it works",
      role: "help",
      click: () => {
        shell.openExternal(variables.howitworks_url);
      },
    },
    {
      label: "Check updates",
      click: () => {
        sharedObject.checkUpdates();
      },
    },
    {
      label: "About",
      click: () => {
        sharedObject.createAboutWindow();
      },
    },
    {
      type: "separator",
    },
    {
      role: "quit",
    },
  ]);

  return {
    infoMenu,
  };
}

function getListMenu(list) {
  const menuItens = list.map((m) => {
    return {
      label: m.text,
      click: () => {
        shell.openExternal(variables.thumbnails_packs + m.link);
      },
    };
  });
  return Menu.buildFromTemplate(menuItens);
}

exports.menus = { getMenus, getListMenu };
