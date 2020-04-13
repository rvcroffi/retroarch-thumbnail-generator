(function () {
  let $version = document.getElementsByClassName('version')[0];
  $version.innerHTML = appApi.getAppVersion();
})();