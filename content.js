var extend = require('cog/extend');

module.exports = function(opts) {
  function handleMessage(evt) {
    var data = evt && evt.data;

    // if we have data and a target extension defined, then send it through
    if (data && data.target) {
      chrome.runtime.sendMessage(data, function(response) {
        window.postMessage(extend(response, { src: 'extension' }), '*');
      });
    }
  }

  chrome.runtime.onMessage.addListener(function(data, sender) {
    if (sender.tab) {
      return;
    }

    window.postMessage(extend(data, { src: 'extension' }), '*');
  });

  window.addEventListener('message', handleMessage);
};
