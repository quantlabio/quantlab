// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  IThemeManager
} from '@quantlab/apputils';


/**
 * A plugin for the Jupyter Light Theme.
 */
const plugin: QuantLabPlugin<void> = {
  id: 'jupyter.themes.light',
  requires: [IThemeManager],
  activate: function(app: QuantLab, manager: IThemeManager) {
    manager.register({
      name: 'QuantLab Light',
      load: function() {
        return manager.loadCSS('quantlab-theme-light-extension/index.css');
      },
      unload: function() {
        return Promise.resolve(void 0);
      }
    });
  },
  autoStart: true
};


export default plugin;
