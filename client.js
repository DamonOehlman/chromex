var defaults = require('cog/defaults');
var slimver = require('slimver');
var kgo = require('kgo');
var cuid = require('cuid');
var URL_INLINEINSTALL = 'https://developer.chrome.com/webstore/inline_installation?csw=1';

module.exports = function(opts) {
  var app = typeof chrome != 'undefined' && chrome.app;
  var extension = {};
  var pendingCallbacks = {};

  // create some of the function helpers
  var getVersion = request('version');

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

  function handleMessage(evt) {
    var data = evt && evt.data;
    var responseId = data && data.responseId;
    var handler = responseId && pendingCallbacks[responseId];

    if (typeof handler == 'function') {
      pendingCallbacks[responseId] = null;

      // if we received an error trigger the error
      if (data.error) {
        return handler(new Error(data.error));
      }

      handler(null, data.payload);
    }
  }

  function request(command, requestOpts, callback) {
    // create the request id
    var id = cuid();

    function exec(cb) {
      // regsiter the pending callback
      pendingCallbacks[id] = cb;
      window.postMessage({
        requestId: id,
        target: (opts || {}).target,
        command: command,
        opts: requestOpts
      }, '*');
    }

    if (typeof requestOpts == 'function') {
      callback = requestOpts;
      requestOpts = {};
    }

    return callback ? exec(callback) : exec;
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
