var defaults = require('cog/defaults');

/**
  # chromex

  This is a simple function to assist with the installation and version
  detection for a chrome extension.

**/

module.exports = function(opts, callback) {
  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  // initialise defaults
  opts = defaults({}, opts, {
    inlineInstall: true,

    // this is the id of the eextension you wish to install if not available
    // see detail for your installed extensions on the developer dashboard
    // https://chrome.google.com/webstore/developer/dashboard
    extension: '',

    // an element reference or selector that must be "clicked" to trigger the install
    // if the extension is already installed this element will have an
    // "ext-installed" class added to it
    installTrigger: '#ext-install-trigger',

    // the class that will be applied to the install trigger if the item is installed
    installedClass: 'ext-installed'
  });

  if (! opts.extension) {
    return callback(new Error('Must specify an extension id in opts'));
  }
};
