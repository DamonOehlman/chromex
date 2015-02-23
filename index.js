var EventEmitter = require('eventemitter3');
var reURLPermission = /^[\w\*]+\:\/\//;

/**
  # chromex

  This is a set of helpers for working with chrome extensions.

  ## Usage

  To be completed.

**/
module.exports = function(opts) {
  var extension = new EventEmitter();
  var manifest = (opts || {}).manifest || {};
  var urlPatterns = extractUrlPatterns(manifest.permissions);

  // get the name from the opts or manifest
  var name = ((opts || {}).name || manifest.short_name || '').toLowerCase();

  function extractUrlPatterns(permissions) {
    return (permissions || []).filter(function(permission) {
      return reURLPermission.test(permission);
    });
  }

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

  function refreshExistingTabs(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.executeScript(tab.id, {
        file: 'scripts/message-bridge.js',
        runAt: 'document_start'
      });
    });
  }

  // handle version requests
  extension.on('version', handleVersionRequest);
  extension.on('installed', handleInstallCheck);

  console.log('initializing extension: ', opts);
  chrome.runtime.onConnect.addListener(function(port) {
    console.log('connected', port);
    port.onMessage.addListener(handleRequest(port));
  });

  urlPatterns.forEach(function(pattern) {
    chrome.tabs.query({
      status: 'complete',
      url: pattern
    }, refreshExistingTabs);
  });

  return extension;
};
