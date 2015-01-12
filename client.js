var defaults = require('cog/defaults');
var slimver = require('slimver');
var kgo = require('kgo');
var cuid = require('cuid');
var URL_INLINEINSTALL = 'https://developer.chrome.com/webstore/inline_installation?csw=1';

module.exports = function(opts) {
  var app = typeof chrome != 'undefined' && chrome.app;
  var extension = {};
  var pendingCallbacks = {};

  function checkAvailable(version, callback) {
    if (typeof version == 'function') {
      callback = version;
      version = null;
    }

    kgo
    ('checkInstalled', checkInstalled)
    ('getVersion', getVersion)
    ('checkAvailable', ['checkInstalled', 'getVersion'], function() {
    })
    .on('error', callback);
  }

  function checkInstalled(callback) {
    if (! app) {
      return callback(new Error('Inline install required for extension detection, see ' + URL_INLINEINSTALL));
    }
  }

  function getVersion(callback) {
    request('version', callback);
  }

  function handleMessage(evt) {
    var responseId = evt && evt.data && evt.data.responseId;
    var handler = responseId && pendingCallbacks[responseId];

    if (typeof handler == 'function') {
      pendingCallbacks[responseId] = null;
      handler(null, evt.data);
    }
  }

  function request(command, requestOpts, callback) {
    // create the request id
    var id = cuid();

    if (typeof requestOpts == 'function') {
      callback = requestOpts;
      requestOpts = {};
    }

    // regsiter the pending callback
    pendingCallbacks[id] = callback;
    window.postMessage({
      requestId: id,
      target: (opts || {}).target,
      command: command,
      opts: requestOpts
    }, '*');
  }

  // initialise defaults
  opts = defaults({}, opts, {
    inlineInstall: true,

    // this is the id of the eextension you wish to install if not available
    // see detail for your installed extensions on the developer dashboard
    // https://chrome.google.com/webstore/developer/dashboard
    id: '',

    // an element reference or selector that must be "clicked" to trigger the install
    // if the extension is already installed this element will have an
    // "ext-installed" class added to it
    installTrigger: '#ext-install-trigger',

    // the class that will be applied to the install trigger if the item is installed
    installedClass: 'ext-installed'
  });

  extension.available = checkAvailable;
  extension.getVersion = getVersion;

  // listen for window messages just like everybody else
  window.addEventListener('message', handleMessage);

  return extension;
};
