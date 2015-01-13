var extend = require('cog/extend');

module.exports = function(opts) {
  var port = chrome.runtime.connect(chrome.runtime.id);

  port.onMessage.addListener(function(msg) {
    window.postMessage(msg, '*');
  });


  function handleMessage(evt) {
    var data = evt && evt.data;

    if (evt.source != window) {
      return;
    }

    console.log('bridge got message: ', evt);
    port.postMessage(data);

//     // if we have data and a target extension defined, then send it through
//     if (data && data.target) {
//       chrome.runtime.sendMessage(data, function(response) {
//         window.postMessage(response, '*');
//       });
//     }
  }

//   chrome.runtime.onMessage.addListener(function(data, sender) {
//     if (sender.tab) {
//       return;
//     }

//     window.postMessage(extend(data, { src: 'extension' }), '*');
//   });

  window.addEventListener('message', handleMessage);
};
