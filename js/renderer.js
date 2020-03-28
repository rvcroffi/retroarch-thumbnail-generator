
$(document).ready(() => {

  let model = {
    init: () => {
      model.currWindow = window.appApi.currWindow;
      model.sendMessage = window.appApi.sendMessage;
      model.loadPlaylist = window.appApi.loadPlaylist;
      model.matchFilenames = window.appApi.matchFilenames;
    }
  };

  let controller = {
    init: () => {
      controller.loadedPlaylist = [];
      controller.loadedImagelist = [];
      model.init();
      view.init();
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
      let filteredList = list.filter((file) => {
        return /^image\//.test(file.type.toLowerCase());
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
    matchFilenames: () => {
      let config = controller.getStateLists();
      if (!config.playlist) {
        view.showWarningMessage('Load playlist file');
        return;
      }
      if (!config.imagelist) {
        view.showWarningMessage('Load image folder');
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
      let result = model.matchFilenames(controller.loadedImagelist, fuseOptions);
      // console.log(controller.loadedImagelist);
      // console.log(result);
      controller.loadedPlaylist = result;
      view.renderPlaylistTable();
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
        view.playlistTitle = loadedFile.name.replace('.lpl', '');
        controller.loadedPlaylist = controller.loadPlaylist(loadedFile.path);
        view.renderPlaylistTable();
        view.checkStateButtons();
      } else {
        view.showWarningMessage('Invalid playlist file');
      }
    },
    handleLoadedThumbnails: (filelist) => {
      if (filelist && filelist.length > 0) {
        let files = Array.from(filelist);
        controller.loadedImagelist = controller.filterImageList(files);
        if (controller.loadedImagelist.length > 0) {
          view.checkStateButtons();
        } else {
          view.showWarningMessage('No image files found');
        }
      } else {
        view.showWarningMessage('No files found');
      }
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
      view.playlistTitle = 'Playlist Title';
      view.btn_load_playlist = $('#btn-load-playlist');
      view.ipt_file_playlist = $('#ipt-file-playlist');
      view.btn_dir_thumbnails = $('#btn-dir-thumbnails');
      view.ipt_dir_thumbnails = $('#ipt-dir-thumbnails');
      view.btn_run = $('#btn-run');
      view.tbl_playlist = $('#tbl-playlist');
      view.actions();
    },
    actions: () => {
      view.btn_load_playlist.on('click', () => {
        view.ipt_file_playlist.trigger('click');
      });
      view.ipt_file_playlist.on('change', e => {
        let file = e.target.files[0];
        if (file) {
          controller.handleLoadedPlaylist(file);
        }
      });
      view.btn_dir_thumbnails.on('click', () => {
        view.ipt_dir_thumbnails.trigger('click');
      });
      view.ipt_dir_thumbnails.on('change', e => {
        let filelist = e.target.files;
        controller.handleLoadedThumbnails(filelist);
        view.ipt_dir_thumbnails.val(null);
      });
      view.btn_run.on('click', () => {
        controller.matchFilenames();
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
      view.tbl_playlist.find('tbody').html(rows);
      view.tableActions();
      view.tbl_playlist.find('caption').text(view.playlistTitle);
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
      // TODO alterar background-color
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
    },
    checkStateButtons: () => {
      let config = controller.getStateLists();
      if (config.playlist) {
        view.btn_load_playlist.removeClass('btn-default');
        view.btn_load_playlist.addClass('btn-positive');
      } else {
        view.btn_load_playlist.removeClass('btn-positive');
        view.btn_load_playlist.addClass('btn-default');
      }
      if (config.imagelist) {
        view.btn_dir_thumbnails.removeClass('btn-default');
        view.btn_dir_thumbnails.addClass('btn-positive');
      } else {
        view.btn_dir_thumbnails.removeClass('btn-positive');
        view.btn_dir_thumbnails.addClass('btn-default');
      }
    },
    showMessage: (msg, title) => {
      controller.sendMessage(msg, title);
    },
    showErrorMessage: (msg, title) => {
      controller.sendMessage(msg, title, 'error');
    },
    showWarningMessage: (msg, title) => {
      controller.sendMessage(msg, title, 'warning');
    }
  };

  controller.init();
});