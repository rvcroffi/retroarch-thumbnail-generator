const { contextBridge } = require("electron");
const remote = require("@electron/remote");
// const menus = require("./menus").menus;

try {
  const sharedObject = remote.getGlobal("sharedObject");
  const menus = remote.getGlobal("menus");
  const customMenus = menus.getMenus(sharedObject);
  let packsMenu;

  contextBridge.exposeInMainWorld("appApi", {
    currWindow: remote.BrowserWindow.getFocusedWindow(),
    showInfoMenu,
    setPackListMenu,
    showPackListMenu,
    ...sharedObject,
  });

  function showInfoMenu() {
    customMenus.infoMenu.popup();
  }
  function showPackListMenu() {
    packsMenu.popup();
  }

  function setPackListMenu(list) {
    packsMenu = menus.getListMenu(list);
  }
} catch (error) {
  console.log(error);
}
