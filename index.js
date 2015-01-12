var EventEmitter = require('eventemitter3');

module.exports = function(opts) {
  var extension = new EventEmitter();
  var manifest = (opts || {}).manifest;

  // get the name from the opts or manifest
  var name = ((opts || {}).name || manifest.short_name || '').toLowerCase();

  function handleRequest(request, sender, sendResponse) {
    var target = (request.target || '*').toLowerCase();

    // if we don't have a command, then abort
    if (! request.command) {
      return;
    }

    // if this is a request that can be handled by this extension then process
    if (target === '*' || (! name) || target === name) {
      extension.emit(request.command, request.opts || {}, sendResponse);
    }
  }

  function handleVersionRequest(opts, callback) {
    console.log('handling version request');
  }

  // handle version requests
  extension.on('version', handleVersionRequest);

  console.log('initializing extension: ', opts);
  chrome.runtime.onMessage.addListener(handleRequest);

  return extension;
};
