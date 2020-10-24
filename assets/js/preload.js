const { remote } = require("electron");
const menus = require("./menus").menus;

const sharedObject = remote.getGlobal("sharedObject");
const customMenus = menus.getMenus(sharedObject);
let packsMenu;

window.appApi = {
  currWindow: remote.BrowserWindow.getFocusedWindow(),
  showInfoMenu,
  setPackListMenu,
  showPackListMenu,
  ...sharedObject,
};

function showInfoMenu() {
  customMenus.infoMenu.popup();
}
function showPackListMenu() {
  packsMenu.popup();
}

function setPackListMenu(list) {
  packsMenu = menus.getListMenu(list);
}
