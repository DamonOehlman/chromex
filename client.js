var defaults = require('cog/defaults');
var slimver = require('slimver');
var EventEmitter = require('eventemitter3');
var kgo = require('kgo');
var cuid = require('cuid');
var tickInit = Date.now();

module.exports = function(opts) {
  var initDelay = (opts || {}).initDelay || 100;
  var extension = new EventEmitter();
  var pendingCallbacks = {};

  // create some of the function helpers
  var getVersion = sendCommand('version');

  function checkInstalled(callback) {
    return sendCommand('installed', { timeout: 500 }, function(err) {
      callback(err && new Error('extension not installed'));
    });
  }

  function checkSatisfies(range, callback) {
    if (typeof range == 'function') {
      callback = range;
      range = '*';
    }

    kgo
    ('checkInstalled', checkInstalled)
    ('getVersion', getVersion)
    ('checkAvailable', ['!checkInstalled', 'getVersion'], function(version, done) {
      // normalise the version
      version = normalizeVersion(version);

      // check to see if the detected version satisfies the required version
      if (! slimver.satisfies(version, range)) {
        return done(new Error('Currently installed extension version "' + version + '" does not meet range requirements: ' + range));
      }

      done(null, version);
    })
    (['*', 'checkAvailable'], callback)
  }

  function handleMessage(evt) {
    var data = evt && evt.data;
    var responseId = data && data.responseId;
    var handler = responseId && pendingCallbacks[responseId];

    console.log('received message: ', evt);

    if (typeof handler == 'function') {
      pendingCallbacks[responseId] = null;

      // if we received an error trigger the error
      if (data.error) {
        return handler(new Error(data.error));
      }

      // if the extension component is sending us all the args, use them
      if (data.args) {
        handler.apply(null, [null].concat(data.args));
      }
      // otherwise, default to using the payload
      else {
        handler(null, data.payload);
      }
    }
    else if (data.message) {
      extension.emit(data.message, data);
    }
  }

  function ready(callback) {
    var diff = Date.now() - tickInit;

    if (diff > initDelay) {
      return callback()
    }

    return setTimeout(callback, initDelay - diff);
  }

  function normalizeVersion(version) {
    var parts = version.split('.');
    while (parts.length < 3) {
      parts.push('0');
    }

    return parts.join('.');
  }

  function sendCommand(command, requestOpts, callback) {
    // create the request id
    var id = cuid();

    function exec(cb) {
      var timeout = (requestOpts || {}).timeout;

      function checkProcessed() {
        if (pendingCallbacks[id]) {
          pendingCallbacks[id] = undefined;
          cb(new Error('command "' + command + '" timed out'));
        }
      }

      ready(function() {
        if (timeout) {
          setTimeout(checkProcessed, timeout);
        }

        // regsiter the pending callback
        pendingCallbacks[id] = cb;
        window.postMessage({
          requestId: id,
          target: (opts || {}).target,
          command: command,
          opts: requestOpts
        }, '*');
      });
    }

    if (typeof requestOpts == 'function') {
      callback = requestOpts;
      requestOpts = undefined;
    }

    return callback ? exec(callback) : exec;
  }

  extension.installed = checkInstalled;
  extension.satisfies = checkSatisfies;
  extension.getVersion = getVersion;
  extension.sendCommand = sendCommand;

  // listen for window messages just like everybody else
  window.addEventListener('message', handleMessage);

  return extension;
};
