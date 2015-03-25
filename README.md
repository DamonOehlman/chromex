# chromex

This is a set of helpers for working with chrome extensions.


[![NPM](https://nodei.co/npm/chromex.png)](https://nodei.co/npm/chromex/)

[![bitHound Score](https://www.bithound.io/github/DamonOehlman/chromex/badges/score.svg)](https://www.bithound.io/github/DamonOehlman/chromex) 

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

```js
var h = require('hyperscript');
var extension = require('chromex/client')({
  target: 'rtc.io screenshare'
});

var installButton = h('button', 'Install Extension', { onclick: function() {
  chrome.webstore.install();
}});

function informReady() {
  document.body.appendChild(h('div', 'ready to go!'));
}

// detect whether the extension is installed
extension.installed(function(err) {
  var actions = document.getElementById('actions');

  if (err) {
    return actions.appendChild(installButton);
  }
});

// on install show the capture button and remove the install button if active
extension.on('activate', function() {
  if (installButton.parentNode) {
    installButton.parentNode.removeChild(installButton);
  }

  informReady();
});

```

HTML:

```html
<html>
<head>
<title>Chromex Example Page</title>
<link rel="chrome-webstore-item" href="https://chrome.google.com/webstore/detail/einjngigaajacmojcohefgmnhhdnllic">
</head>
<body>
<div id="main"></div>
<div id="actions"></div>
<script src="bundle.js"></script>
</body>
</html>

```

## License(s)

### ISC

Copyright (c) 2015, Damon Oehlman <damon.oehlman@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
