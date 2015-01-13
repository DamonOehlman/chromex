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

  function handleRequest(request, sender, sendResponse) {
    var target = (request.target || '*').toLowerCase();
    var requestId = request.requestId;

    function handleResponse(err, payload) {
      if (err) {
        return sendResponse({
          responseId: requestId,
          error: '' + err
        });
      }

      sendResponse({ responseId: requestId, payload: payload });
    }

    // if we don't have a command, then abort
    if (! request.command) {
      return;
    }

    // if this is a request that can be handled by this extension then process
    if (target === '*' || (! name) || target === name) {
      extension.emit(request.command, request.opts || {}, handleResponse);
    }
  }

  function handleVersionRequest(opts, callback) {
    var version = manifest.version || '';
    if (! version) {
      return callback(new Error('no version found or manifest not supplied'));
    }

    callback(null, version);
  }

  // handle version requests
  extension.on('version', handleVersionRequest);

  console.log('initializing extension: ', opts);
  chrome.runtime.onMessage.addListener(handleRequest);

  return extension;
};
