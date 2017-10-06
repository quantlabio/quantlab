// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Toolbar
} from '@quantlab/apputils';

import {
  SQL
} from './widget';


/**
 * A namespace for the default toolbar items.
 */
export
namespace ToolbarItems {

  /**
   * Add the default items to the panel toolbar.
   */
  export
  function populateDefaults(panel: SQL): void {
    let toolbar = panel.toolbar;
    toolbar.addItem('interrupt', Toolbar.createInterruptButton(panel.session));
    toolbar.addItem('restart', Toolbar.createRestartButton(panel.session));

    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    toolbar.addItem('kernelName', Toolbar.createKernelNameItem(panel.session));
    toolbar.addItem('kernelStatus', Toolbar.createKernelStatusItem(panel.session));
  }

}
