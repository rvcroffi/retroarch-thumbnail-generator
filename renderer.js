$(document).ready(() => {
  const currWindow = window.appApi.currWindow;
  const sendMessage = window.appApi.sendMessage;
  const loadPlaylist = window.appApi.loadPlaylist;

  let model = {
    init: () => {

    }
  };

  let controller = {
    init: () => {
      model.init();
      view.init();
    }
  };

  let view = {
    init: () => {
      view.btn_load_playlist = $('#btn-load-playlist');
      view.ipt_file_playlist = $('#ipt-file-playlist');
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
          if (view.isPlaylistValid(file.name)) {
            let list = loadPlaylist(file.path);
            view.renderPlaylistTable(list);
          } else {
            sendMessage('Invalid playlist file');
          }
        }
      });
    },
    isPlaylistValid: (name) => {
      return /.*\.lpl$/.test(name.toLowerCase());
    },
    renderPlaylistTable: (list) => {
      let rows = '';
      list.forEach(row => {
        rows += `<tr>
          <td>${row.label}</td>
          <td></td>
          <td></td>
        </tr>`;
      });
      view.tbl_playlist.find('tbody').html(rows);
    }
  };

  controller.init();
});