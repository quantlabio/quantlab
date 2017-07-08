// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var QuantLab = require('@quantlab/application').QuantLab;

// ES6 Promise polyfill
require('es6-promise/auto');

require('font-awesome/css/font-awesome.min.css');

var mods = [
  require('@quantlab/application-extension'),
  require('@quantlab/apputils-extension'),
  require('@quantlab/codemirror-extension'),
  require('@quantlab/completer-extension'),
  require('@quantlab/console-extension'),
  require('@quantlab/csvviewer-extension'),
  require('@quantlab/docmanager-extension'),
  require('@quantlab/fileeditor-extension'),
  require('@quantlab/faq-extension'),
  require('@quantlab/filebrowser-extension'),
  require('@quantlab/help-extension'),
  require('@quantlab/imageviewer-extension'),
  require('@quantlab/inspector-extension'),
  require('@quantlab/launcher-extension'),
  require('@quantlab/markdownviewer-extension'),
  require('@quantlab/notebook-extension'),
  require('@quantlab/running-extension'),
  require('@quantlab/services-extension'),
  require('@quantlab/settingeditor-extension'),
  require('@quantlab/shortcuts-extension'),
  require('@quantlab/tabmanager-extension'),
  require('@quantlab/terminal-extension'),
  require('@quantlab/theme-light-extension'),
  require('@quantlab/tooltip-extension')
];


window.onload = function() {
  var lab = new QuantLab({ namespace: 'quantlab-example' });
  lab.registerPluginModules(mods);
  lab.start();
}
