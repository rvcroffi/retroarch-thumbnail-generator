
$(document).ready(() => {

  let model = {
    init: () => {
      model.currWindow = window.appApi.currWindow;
      model.handleError = window.appApi.handleError;
      model.sendMessage = window.appApi.sendMessage;
      model.openDirectory = window.appApi.openDirectory;
      model.readDirectory = window.appApi.readDirectory;
      model.loadPlaylist = window.appApi.loadPlaylist;
      model.matchFilenames = window.appApi.matchFilenames;
      model.saveImages = window.appApi.saveImages;
    }
  };

  let controller = {
    init: () => {
      controller.loadedPlaylist = [];
      controller.loadedImagelist = [];// {name: string, dirpath: string}
      model.init();
      view.init();
    },
    handleError: (error) => {
      let = oError = model.handleError(error);
      if (oError.error) console.log(oError.error);
    },
    loadPlaylist: (path) => {
      return model.loadPlaylist(path);
    },
    isPlaylistValid: (name) => {
      return /.*\.lpl$/.test(name.toLowerCase());
    },
    isImageValid: (type) => {
      return /^image\//.test(type.toLowerCase());
    },
    filterImageList: (list) => {
      let filteredList = list.filter((filename) => {
        return /\.png$/.test(filename.toLowerCase());
      });
      return filteredList;
    },
    updateImageOnList: (file, idx) => {
      if (controller.isImageValid(file.type)) {
        controller.loadedPlaylist[idx].thumbnail = {
          name: file.name,
          path: file.path
        };
        view.updateRowTbl(idx);
      } else {
        view.showWarningMessage('Invalid image file');
      }
    },
    clearImageOnList: (idx) => {
      controller.loadedPlaylist[idx].thumbnail = null;
      view.updateRowTbl(idx);
    },
    validateListsForMatch: () => {
      let config = controller.getStateLists();
      let msgalert = '', isValid = true;
      if (!config.playlist) {
        msgalert = 'Load your playlist file. ';
        isValid = false;
      }
      if (!config.imagelist) {
        msgalert += 'Set your image folder.';
        isValid = false;
      }
      if (!isValid) {
        view.showWarningMessage(msgalert);
      }
      return isValid;
    },
    matchFilenames: () => {
      if (!controller.validateListsForMatch()) {
        return;
      }
      let fuseDefaultOptions = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        minMatchCharLength: 1,
        keys: [
          "name"
        ]
      };
      let customFuseOptions = view.getFuseOptions();
      let fuseOptions = $.extend(true, fuseDefaultOptions, customFuseOptions);
      view.showLoading('Analyzing data..');
      model.matchFilenames(controller.loadedImagelist, fuseOptions)
        .then((result) => {
          view.hideLoading();
          controller.loadedPlaylist = result;
          view.renderPlaylistTable();
        })
        .catch((error) => {
          view.hideLoading();
          controller.handleError(error);
        });
    },
    getStateLists: () => {
      let config = {
        playlist: false,
        imagelist: false
      };
      if (controller.loadedPlaylist.length) config.playlist = true;
      if (controller.loadedImagelist.length) config.imagelist = true;
      return config;
    },
    handleLoadedPlaylist: (loadedFile) => {
      if (controller.isPlaylistValid(loadedFile.name)) {
        view.$playlistTitle = loadedFile.name.replace('.lpl', '');
        controller.loadPlaylist(loadedFile.path)
          .then((playlist) => {
            controller.loadedPlaylist = playlist;
            view.renderPlaylistTable();
            view.setPlaylistPath(loadedFile.path);
          })
          .catch((error) => {
            controller.handleError(error);
          });
      } else {
        view.showWarningMessage('Invalid playlist file');
      }
    },
    openDirectory: () => {
      return model.openDirectory();
    },
    readDirectory: (result) => {
      if (!result.canceled) {
        return model.readDirectory(result.filePaths[0])
          .then((filelist) => {
            return {
              filelist: filelist,
              dirpath: result.filePaths[0]
            };
          });
      }
      return Promise.resolve(false);
    },
    countImagesOnPlaylist: () => {
      let totalimages = 0;
      controller.loadedPlaylist.forEach((item) => {
        if (item.thumbnail && item.thumbnail.path) totalimages++;
      });
      return totalimages;
    },
    handleSaveButton: () => {
      let totalimages = controller.countImagesOnPlaylist();
      if (totalimages) {
        controller.openDirectory()
          .then(result => {
            if (!result.canceled) {
              let saved = 0;
              view.showLoading(`Saving [${saved} / ${totalimages}]`);
              return controller.saveImages(result.filePaths[0], () => {
                saved++;
                view.showLoading(`Saving [${saved} / ${totalimages}]`);
              });
            } else {
              return Promise.resolve(true);
            }
          })
          .then((canceled) => {
            view.hideLoading();
            if (!canceled) view.showMessage('Your images have been saved!');
          })
          .catch((error) => {
            view.hideLoading();
            controller.handleError(error);
          });
      } else {
        view.showWarningMessage('No images in your playlist');
      }
    },
    handleThumbButton: () => {
      controller.openDirectory()
        .then(controller.readDirectory)
        .then(controller.handleLoadedThumbnails)
        .catch((error) => {
          controller.handleError(error);
        });
    },
    handleLoadedThumbnails: (result) => {
      if (result) {
        if (result.filelist.length > 0) {
          let imageList = controller.filterImageList(result.filelist);
          if (imageList.length > 0) {
            controller.loadedImagelist = imageList.map((imagename) => {
              return {
                name: imagename,
                dirpath: result.dirpath
              };
            });
            view.setImageFolderPath(result.dirpath);
          } else {
            view.showWarningMessage('No image files found');
          }
        } else {
          view.showWarningMessage('No files found');
        }
      }
    },
    saveImages: (dirpath, callback) => {
      return model.saveImages(controller.loadedPlaylist, dirpath, callback);
    },
    sendMessage: (msg, title, type) => {
      model.sendMessage(msg, title, type);
    },
    closeApp: () => {
      model.currWindow.close();
    }
  };

  let view = {
    init: () => {
      view.$playlistTitle = 'Playlist Title';
      view.$loading = $('.loading');
      view.$footer_text = $('.footer-text');
      view.$playlist_path = $('.playlist-path');
      view.$imagefolder_path = $('.imagefolder-path');
      view.$btn_load_playlist = $('#btn-load-playlist');
      view.$ipt_file_playlist = $('#ipt-file-playlist');
      view.$btn_dir_thumbnails = $('#btn-dir-thumbnails');
      view.$btn_run = $('#btn-run');
      view.$btn_save = $('#btn-save');
      view.$tbl_playlist = $('#tbl-playlist');
      view.actions();
    },
    actions: () => {
      view.$btn_load_playlist.on('click', () => {
        view.$ipt_file_playlist.trigger('click');
      });
      view.$ipt_file_playlist.on('change', e => {
        let file = e.target.files[0];
        if (file) {
          controller.handleLoadedPlaylist(file);
        }
      });
      view.$btn_dir_thumbnails.on('click', () => {
        controller.handleThumbButton();
      });
      view.$btn_run.on('click', () => {
        controller.matchFilenames();
      });
      view.$btn_save.on('click', () => {
        controller.handleSaveButton();
      });
    },
    getFuseOptions: () => {
      let fuseOptions = {
        threshold: 0.9,
        distance: 10
      };
      return fuseOptions;
    },
    renderPlaylistTable: () => {
      let rows = '', tdclass, name, thumbimg, btngroup, score;
      controller.loadedPlaylist.forEach((row, idx) => {
        tdclass = row.thumbnail ? '' : 'text-center';
        name = row.thumbnail ? row.thumbnail.name : '';
        score = row.thumbnail ? row.thumbnail.score.toFixed(2) : 0;
        thumbimg = row.thumbnail ? (`<img src="${row.thumbnail.path}" class="thumbimg"/>`) : '-';
        btngroup = `<div class="btn-group">
          <input type="file" class="ipt-edit" hidden data-idx="${idx}">
          <button class="btn btn-mini btn-default btn-edit">
            <span class="icon icon-pencil"></span>
          </button>
          <button class="btn btn-mini btn-negative btn-delete" data-idx="${idx}" ${!row.thumbnail ? 'style="display:none;"' : ''}>
            <span class="icon icon-cancel"></span>
          </button>
        </div>`;
        rows += `<tr id="tbl-row-${idx}" style="background-color:rgba(255,200,210,${score})">
          <td title="${row.label}">${row.label}</td>
          <td class="${tdclass} thumbname" title="${name}">${name || '-'}</td>
          <td class="text-center thumbnail">${thumbimg}</td>
          <td class="text-center">${btngroup}</td>
        </tr>`;
      });
      view.$tbl_playlist.find('tbody').html(rows);
      view.tableActions();
    },
    tableActions: () => {
      $('.btn-edit').on('click', (e) => {
        $(e.currentTarget).prev('.ipt-edit').trigger('click');
      });
      $('.ipt-edit').on('change', (e) => {
        let idx = $(e.currentTarget).data('idx');
        let file = e.currentTarget.files[0];
        controller.updateImageOnList(file, idx);
      });
      $('.btn-delete').on('click', (e) => {
        let idx = $(e.currentTarget).data('idx');
        controller.clearImageOnList(idx);
      });
    },
    updateRowTbl: (idx) => {
      let thumbnail = controller.loadedPlaylist[idx].thumbnail;
      let thumbnameEl = $(`#tbl-row-${idx} .thumbname`);
      let thumbnailEl = $(`#tbl-row-${idx} .thumbnail`);
      let thumbimgEl = $(`#tbl-row-${idx} .thumbimg`);
      let btnDeleteEl = $(`#tbl-row-${idx} .btn-delete`);
      if (thumbnail) {
        thumbnameEl.text(thumbnail.name);
        if (thumbimgEl.length) {
          thumbimgEl.attr('src', thumbnail.path);
        } else {
          thumbnailEl.html(`<img src="${thumbnail.path}" class="thumbimg"/>`);
        }
        btnDeleteEl.show();
      } else {
        thumbnameEl.text('-');
        thumbnailEl.text('-');
        btnDeleteEl.hide();
      }
      $(`#tbl-row-${idx}`).css('background-color', '');
    },
    setImageFolderPath: (path) => {
      view.$imagefolder_path.text(path);
    },
    setPlaylistPath: (path) => {
      view.$playlist_path.text(path);
    },
    showMessage: (msg, title) => {
      controller.sendMessage(msg, title, 'info');
    },
    showErrorMessage: (msg, title) => {
      controller.sendMessage(msg, title, 'error');
    },
    showWarningMessage: (msg, title) => {
      controller.sendMessage(msg, title, 'warning');
    },
    showLoading: (msg) => {
      view.$loading.show();
      view.$footer_text.text(msg);
      view.disableInterface();
    },
    hideLoading: () => {
      view.$loading.hide();
      view.$footer_text.text('');
      view.enableInterface();
    },
    showFooterMsg: (msg) => {
      view.$footer_text.text(msg);
      setTimeout(() => {
        view.$footer_text.fadeOut(1000);
      }, 2000);
    },
    disableInterface: () => {
      $('button').prop('disabled', true);
    },
    enableInterface: () => {
      $('button').prop('disabled', false);
    }
  };

  controller.init();
});