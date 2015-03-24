var h = require('hyperscript');
var extension = require('../client')({
  target: 'rtc.io screenshare'
});

var installButton = h('button', 'Install Extension', { onclick: function() {
  chrome.webstore.install();
}});

function informReady() {
  document.body.appendChild(h('div', 'ready to go!'));
}

// detect whether the extension is installed
extension.installed(function(err) {
  var actions = document.getElementById('actions');

  if (err) {
    return actions.appendChild(installButton);
  }

  informReady();
});

// on install show the capture button and remove the install button if active
extension.on('activate', function() {
  if (installButton.parentNode) {
    installButton.parentNode.removeChild(installButton);
  }

  informReady();
});
