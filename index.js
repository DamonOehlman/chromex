var EventEmitter = require('eventemitter3');
var reURLPermission = /^[\w\*]+\:\/\//;

/**
  # chromex

  This is a set of helpers for working with chrome extensions.

  ## Example Usage

  To run the example that is included in this repo, first install
  browserify and beefy:

  ```
  npm install -g browserify beefy
  ```

  Then run `npm start` to run the example.

  __NOTE:__  Because the example is attempting to use inline installation
  to install the rtc.io screensharing extension (as an example) you will
  need to set a host entry for `local.rtc.io` to point to `localhost`. This
  is because inline installation is only allowed for specific domains on
  any particular extension.

  Once you have everything setup goto <http://local.rtc.io:9966> and take
  the example for a spin. If you are interested in the code, it's shown
  below:

  JS:

  <<< examples/detect-installed.js

  HTML:

  <<< examples/index.html

**/
module.exports = function(opts) {
  var extension = new EventEmitter();
  var manifest = (opts || {}).manifest || {};
  var urlPatterns = extractUrlPatterns(manifest.permissions);
  var connectedPorts = [];

  // get the name from the opts or manifest
  var name = ((opts || {}).name || manifest.short_name || '').toLowerCase();

  function couplePort(port) {
    port.onDisconnect.addListener(function() {
      var portIndex = connectedPorts.indexOf(port);
      if (portIndex >= 0) {
        connectedPorts.splice(portIndex, 1);
        console.log('no longer tracking port: ', port);
      }
    });

    connectedPorts.push(port);
    port.onMessage.addListener(handleRequest(port));
    console.log('tracking port: ', port);
  }

  function extractUrlPatterns(permissions) {
    return (permissions || []).filter(function(permission) {
      return reURLPermission.test(permission);
    });
  }

  function getUrlPermissions() {
    return [].concat(urlPatterns);
  }

  function handleRequest(port) {
    return function(message) {
      var target = (message.target || '*').toLowerCase();
      var requestId = message.requestId;

      function handleResponse(err, payload) {
        if (err) {
          return port.postMessage({ responseId: requestId, error: '' + err });
        }

        port.postMessage({
          responseId: requestId,
          payload: payload,
          args: [].slice.call(arguments, 1)
        });
      }

      // if we don't have a command, then abort
      if (! message.command) {
        return;
      }
      
      console.log(target, name);

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

  function send(message) {
    var args = [].slice.call(arguments, 1);

    console.log('attempting to send message: "' + message + '" to connected ports: ', connectedPorts);

    connectedPorts.forEach(function(port) {
      port.postMessage({
        message: message,
        args: args
      });
    });
  }

  // handle version requests
  extension.on('version', handleVersionRequest);
  extension.on('installed', handleInstallCheck);

  console.log('initializing extension: ', opts);
  chrome.runtime.onConnect.addListener(couplePort);

  urlPatterns.forEach(function(pattern) {
    chrome.tabs.query({
      status: 'complete',
      url: pattern
    }, refreshExistingTabs);
  });

  extension.getUrlPermissions = getUrlPermissions;
  extension.send = send;

  return extension;
};
