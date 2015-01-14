(function() {
  var port = chrome.runtime.connect(chrome.runtime.id);
  port.onMessage.addListener(function(msg) {
    window.postMessage(msg, '*');
  });

  function handleMessage(evt) {
    if (evt.source != window) {
      return;
    }

    // if this is a tagged request from the chromex client then passthrough
    if (evt.data && evt.data.requestId) {
      port.postMessage(evt.data);
    }
  }

  console.log('chromex message bridge initialized');
  window.addEventListener('message', handleMessage);
})();
