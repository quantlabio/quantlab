// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  IThemeManager
} from '@quantlab/apputils';


/**
 * A plugin for the Jupyter Dark Theme.
 */
const plugin: QuantLabPlugin<void> = {
  id: 'jupyter.themes.dark',
  requires: [IThemeManager],
  activate: function(app: QuantLab, manager: IThemeManager) {
    manager.register({
      name: 'QuantLab Dark',
      load: function() {
        return manager.loadCSS('quantlab-theme-dark-extension/index.css');
      },
      unload: function() {
        return Promise.resolve(void 0);
      }
    });
  },
  autoStart: true
};


export default plugin;
