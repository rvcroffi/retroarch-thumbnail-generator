const Fuse = require('fuse.js');
const path = require('path');

process.on('message', (obj) => {
  try {
    let fuse = new Fuse(obj.filelist, obj.options);
    let totalItems = obj.loadedPlaylist.length;
    let updatedPlaylist = obj.loadedPlaylist.map((item, idx) => {
      let new_item = {
        label: item.label,
        path: item.path
      };
      let result = fuse.search(item.label);
      if (result.length > 0) {
        //result[0] is the item with best match score
        new_item.thumbnail = {
          name: result[0].item.name,
          path: path.join(result[0].item.dirpath, result[0].item.name),
          score: result[0].score,
        };
      }
      process.send({
        progress: (idx + 1) / totalItems
      });
      return new_item;
    });
    process.send({
      updatedPlaylist: updatedPlaylist,
      progress: 2
    });
  } catch (e) {
    process.send({ err: true, error: e });
  }
});
