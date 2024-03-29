const { app, Menu } = require("electron");
// const { autoUpdater } = require('electron-updater');
("use strict");

if (process.env.NODE_ENV == "development") {
  require("electron-reloader")(module);
  app.setAppUserModelId(process.execPath);
} else {
  app.setAppUserModelId("com.rvcroffi.retroarch-thumbnail-generator");
}

global.sharedObject = {
  handleError,
  sendMessage,
  sendQuestion,
  openDirectory,
  readDirectory,
  loadPlaylist,
  resetPlaylist,
  matchFilenames,
  saveImages,
  // quitApp,
  checkUpdates,
  savePlaylist,
  createAboutWindow,
  getAppVersion,
  getThumbnailsPacksList,
  getThumbnailsPack,
};

global.menus = require("./assets/js/menus").menus;

var mainWindow = null,
  loadedPlaylist = [];

/**
 * Handles the error throwed by the application.
 * @param {(Object|string)} error Application error
 */
function handleError(error) {
  let oError = {
    userMessage: "",
    error: null,
  };
  if (error instanceof Error) {
    oError.userMessage = "An internal application error has occurred";
    oError.error = error;
  } else {
    oError.userMessage = error;
  }
  sendMessage(oError.userMessage, "Error", "error");
  return oError;
}
/**
 * Creates the main window.
 */
function createWindow() {
  const path = require("path");
  const { BrowserWindow } = require("electron");
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 700,
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(app.getAppPath(), "assets", "js", "preload.js"),
    },
    icon: __dirname + "/build/icon.png",
  });

  require("@electron/remote/main").initialize();
  require("@electron/remote/main").enable(mainWindow.webContents);

  Menu.setApplicationMenu(null);

  mainWindow.loadFile("index.html");

  mainWindow.on("close", (e) => {
    let ans = askQuitApp();
    if (ans !== 1) {
      e.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  // Open the DevTools.
  if (process.env.NODE_ENV == "development") {
    mainWindow.webContents.openDevTools();
  }

  //console.log(`This platform is ${process.platform}`);
}

/**
 * Creates the About window.
 */
function createAboutWindow() {
  const path = require("path");
  const { BrowserWindow } = require("electron");
  let aboutWindow = new BrowserWindow({
    width: 480,
    height: 540,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), "assets", "js", "preload.js"),
    },
  });

  require("@electron/remote/main").enable(aboutWindow.webContents);

  aboutWindow.loadFile("./assets/html/about.html");
  aboutWindow.once("ready-to-show", () => {
    aboutWindow.show();
  });

  aboutWindow.on("closed", () => {
    aboutWindow = null;
  });

  if (process.env.NODE_ENV == "development") {
    aboutWindow.webContents.openDevTools();
  }
}

/**
 * Sends a question dialog and returns the result.
 */
function askQuitApp() {
  return sendQuestion("Close application?", "Exit");
}

app.whenReady().then(createWindow);

// Update config
// autoUpdater.autoDownload = false;
// autoUpdater.autoInstallOnAppQuit = false;
// autoUpdater.on('update-available', () => {
//   sendMessage('There is an update available', 'Warning', 'info');
// });
// autoUpdater.on('update-downloaded', () => {
//   sendMessage('Update downloaded', 'Warning', 'info');
// });
// function downloadUpdate() {
//   autoUpdater.downloadUpdate()
//     .catch((e) => {
//       handleError(e);
//     })
// }
// function quitAndInstall(){
//   autoUpdater.quitAndInstall(true, true);
// }

/**
 * Gets the latest app version from GitHub
 */
function getLatestAppRelease() {
  const https = require("https");
  const variables = require("./assets/js/variables").variables;
  return new Promise((resolve, reject) => {
    https
      .get(
        variables.latest_release_url,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "rvcroffi",
          },
        },
        (res) => {
          res.setEncoding("utf8");
          let rawData = "";
          res.on("data", (chunk) => {
            rawData += chunk;
          });
          res.on("end", () => {
            try {
              const parsedData = JSON.parse(rawData);
              resolve(parsedData.name);
            } catch (e) {
              reject(e.message);
            }
          });
        }
      )
      .on("error", (e) => {
        console.error(e);
        reject("Couldn't check for updates");
      });
  });
}

/**
 * Checks for application updates.
 */
function checkUpdates() {
  getLatestAppRelease()
    .then((latestVersion) => {
      let currentVersion = getAppVersion();
      if (currentVersion < latestVersion) {
        const { shell } = require("electron");
        const variables = require("./assets/js/variables").variables;
        let idbtn = sendQuestion(
          "Do you like to download?",
          "Update Available",
          "The browser will open on the download page",
          "Yes"
        );
        if (idbtn) shell.openExternal(variables.download_page_url);
      } else {
        sendMessage("You application is up to date", "No update available");
      }
    })
    .catch(handleError);
}

function getAppVersion() {
  return app.getVersion();
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  const { BrowserWindow } = require("electron");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Sets the progress bar value.
 * @param {number} value Value between 0 and 1
 * @param {Object} opt Options for progress bar
 */
function setProgressBar(value, opt) {
  mainWindow.setProgressBar(value, opt);
}

/**
 * Shows a message dialog on application window.
 * @param {string} msg Message
 * @param {string} [title=Attention] Dialog title
 * @param {string} [type=none] Type of dialog ("none", "info", "error", "question", "warning")
 */
function sendMessage(msg, title, type) {
  const { dialog } = require("electron");
  const dialogOpt = {
    type: type || "none",
    buttons: ["Ok"],
    title: title || "Attention",
    message: msg,
  };
  dialog.showMessageBox(mainWindow, dialogOpt);
}
/**
 * Shows a question dialog on application window.
 * @param {string} msg Message
 * @param {string} [title=Attention] Dialog title
 * @param {string} detail Detail message
 * @param {string} okText Ok button text
 * @param {string} cancelText Cancel button text
 * @returns {number} clicked button id
 */
function sendQuestion(msg, title, detail, okText, cancelText) {
  const { dialog } = require("electron");
  const dialogOpt = {
    type: "question", //"none", "info", "error", "question", "warning"
    buttons: [cancelText || "Cancel", okText || "Ok"],
    defaultId: 0,
    cancelId: 0,
    title: title || "Attention",
    message: msg,
    detail: detail,
  };
  return dialog.showMessageBoxSync(mainWindow, dialogOpt);
}

/**
 * Shows directory open dialog
 * @param {string} path Default path
 */
function openDirectory(path) {
  const { dialog } = require("electron");
  return dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    defaultPath: path,
  });
}

/**
 * Opens save dialog and saves the playlist
 * @param {Array} playlist Playlist
 * @param {string} title Playlist title
 * @param {string} [path=nothumblist.lpl] Default playlist path/name
 */
async function savePlaylist(playlist, title, path) {
  const { dialog } = require("electron");
  let selectedPath = dialog.showSaveDialogSync(mainWindow, {
    title: "Save file",
    defaultPath: path || "nothumblist.lpl",
    filters: [{ name: "LPL File", extensions: ["lpl"] }],
  });
  if (selectedPath) {
    let newPlaylist = {
      name: title,
      items: playlist,
    };
    try {
      const { writeFile } = require("fs").promises;
      let data = JSON.stringify(newPlaylist, null, 2);
      await writeFile(selectedPath, data);
      return true;
    } catch (e) {
      return Promise.reject(e);
    }
  } else {
    return Promise.resolve(false);
  }
}

/**
 * Reads directory
 * @param {string} path Directory path
 */
function readDirectory(path) {
  const { readdir } = require("fs").promises;
  return readdir(path, {
    withFileTypes: false,
  });
}

/**
 * Reads the playlist file
 * @param {string} path Directory path
 */
async function loadPlaylist(path) {
  const { readFile } = require("fs").promises;
  const result = await readFile(path, "utf8");
  let data;
  try {
    data = JSON.parse(result);
  } catch (e) {
    Promise.reject("Invalid playlist format");
  }
  if (data.items.length) {
    loadedPlaylist = data.items;
    resetPlaylist();
    return loadedPlaylist;
  } else {
    Promise.reject("No items in your playlist");
  }
}

/**
 * Resets playlist
 */
function resetPlaylist() {
  loadedPlaylist.forEach((item) => {
    item.thumbnail = null;
  });
  return loadedPlaylist;
}

/**
 * Performs fuzzy search
 * @param {Array} filelist Image file list
 * @param {Object} options Fuse configuration object
 */
function matchFilenames(filelist, options) {
  const path = require("path");
  const cp = require("child_process");
  const { shell } = require("electron");
  return new Promise((resolve, reject) => {
    if (loadedPlaylist.length > 0) {
      try {
        const fuseprocess = cp.fork(
          path.join(app.getAppPath(), "assets", "js", "fuseprocess.js")
        );
        fuseprocess.on("message", (resp) => {
          setProgressBar(resp.progress);
          if (resp.err) {
            setProgressBar(-1, { mode: "error" });
            fuseprocess.kill();
            reject(resp.error);
          } else if (resp.progress === 2) {
            fuseprocess.kill();
            setProgressBar(-1);
            resolve(resp.updatedPlaylist);
          }
          shell.beep();
        });
        fuseprocess.send({
          filelist: filelist,
          options: options,
          loadedPlaylist: loadedPlaylist,
        });
      } catch (e) {
        reject(e);
      }
    } else {
      reject("Invalid Playlist File");
    }
  });
}

/**
 * Saves thumbnails to the dirpath
 * @param {Array} playlist Playlist
 * @param {string} dirpath Directory path
 * @param {Function} callback Callback function
 */
function saveImages(playlist, dirpath, callback) {
  try {
    const path = require("path");
    const { copyFile } = require("fs").promises;
    let promises = Promise.resolve();
    playlist.forEach((element) => {
      if (element.thumbnail) {
        let ext = element.thumbnail.name.substring(
          element.thumbnail.name.lastIndexOf(".")
        );
        let imagename = element.label.replace(/[&*/:`<>?\|]/g, "_") + ext;
        promises = promises.then(() => {
          if (typeof callback === "function") callback();
          return copyFile(
            element.thumbnail.path,
            path.join(dirpath, imagename)
          );
        });
      }
    });
    return promises;
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Gets thumbnails packs list
 */
function getThumbnailsPacksList() {
  const https = require("https");
  const variables = require("./assets/js/variables").variables;
  return new Promise((resolve, reject) => {
    https
      .get(variables.thumbnails_packs, (res) => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          resolve(rawData);
        });
      })
      .on("error", (e) => {
        console.error(e);
        reject(handleError("Thumbnails list cannot be loaded."));
      });
  });
}

/**
 * Gets thumbnail pack (Opens default browser)
 * @param {string} path Thumbnail path
 */
function getThumbnailsPack(path) {
  const { shell } = require("electron");
  const variables = require("./assets/js/variables").variables;
  shell.openExternal(variables.thumbnails_packs + path);
}
