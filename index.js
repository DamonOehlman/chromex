var EventEmitter = require('eventemitter3');

/**
  # chromex

  This is a set of helpers for working with chrome extensions.

  ## Usage

  To be completed.

**/
module.exports = function(opts) {
  var extension = new EventEmitter();
  var manifest = (opts || {}).manifest || {};

  // get the name from the opts or manifest
  var name = ((opts || {}).name || manifest.short_name || '').toLowerCase();

  function handleRequest(port) {
    return function(message) {
      var target = (message.target || '*').toLowerCase();
      var requestId = message.requestId;

      function handleResponse(err, payload) {
        console.log('got response for request (' + requestId + '): ', arguments);
        if (err) {
          return sendResponse({
            responseId: requestId,
            error: '' + err
          });
        }

        port.postMessage({ responseId: requestId, payload: payload });
      }

      // if we don't have a command, then abort
      if (! message.command) {
        return;
      }

      // if this is a request that can be handled by this extension then process
      if (target === '*' || (! name) || target === name) {
        extension.emit(message.command, message.opts || {}, port, handleResponse);
      }
    }
  }

  function handleInstallCheck(request, port, callback) {
    callback(null, true);
  }

  function handleVersionRequest(request, port, callback) {
    var version = manifest.version || '';
    if (! version) {
      return callback(new Error('no version found or manifest not supplied'));
    }

    callback(null, version);
  }

  // handle version requests
  extension.on('version', handleVersionRequest);
  extension.on('installed', handleInstallCheck);

  console.log('initializing extension: ', opts);
  chrome.runtime.onConnect.addListener(function(port) {
    console.log('connected', port);
    port.onMessage.addListener(handleRequest(port));
  });

  return extension;
};
