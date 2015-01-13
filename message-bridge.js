module.exports = function(opts) {
  var port = chrome.runtime.connect(chrome.runtime.id);

  port.onMessage.addListener(function(msg) {
    window.postMessage(msg, '*');
  });


  function handleMessage(evt) {
    if (evt.source != window) {
      return;
    }

    port.postMessage(evt.data);
  }

  window.addEventListener('message', handleMessage);
};
