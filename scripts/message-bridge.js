(function() {
  var port = chrome.runtime.connect(chrome.runtime.id);

  var pending = {};

  port.onMessage.addListener(function(msg) {
    var responseId = msg && msg.responseId;
    var info = pending[responseId];
    var source = (info && info.source) || window;
    delete pending[responseId];
    source.postMessage(msg, '*');
  });

  function handleMessage(evt) {
    // if this is a tagged request from the chromex client then passthrough
    if (evt.data && evt.data.requestId) {
      pending[evt.data.requestId] = { source: evt.source };
      port.postMessage(evt.data);
    }
  }

  function activate(win) {
    win.postMessage({ message: 'activate' }, '*');
  }

  // trigger an install message so we can react if required
  setTimeout(function() {
    activate(window);
    for (var i = 0; i < window.frames.length; i++) {
      activate(window.frames[i]);
    }
  }, 10);

  // listen for local messages
  window.addEventListener('message', handleMessage);
})();
