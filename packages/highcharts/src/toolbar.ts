// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Toolbar, ToolbarButton
} from '@quantlab/apputils';

import {
  HighChartsPanel
} from './panel';


/**
 * The class name added to toolbar save button.
 */
const TOOLBAR_SAVE_CLASS = 'jp-SaveIcon';


/**
 * A namespace for the default toolbar items.
 */
export
namespace ToolbarItems {
  /**
   * Create save button toolbar item.
   */
  export
  function createSaveButton(panel: HighChartsPanel): ToolbarButton {
    return new ToolbarButton({
      className: TOOLBAR_SAVE_CLASS,
      onClick: () => {
        panel.context.model.fromJSON(panel.highcharts.modelJSON());
        panel.context.save().then(() => {
          if (!panel.isDisposed) {
            return panel.context.createCheckpoint();
          }
        });
      },
      tooltip: 'Save the HighCharts contents and create checkpoint'
    });
  }


  /**
   * Add the default items to the panel toolbar.
   */
  export
  function populateDefaults(panel: HighChartsPanel): void {
    let toolbar = panel.toolbar;
    toolbar.addItem('save', createSaveButton(panel));
    toolbar.addItem('interrupt', Toolbar.createInterruptButton(panel.session));
    toolbar.addItem('restart', Toolbar.createRestartButton(panel.session));

    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    toolbar.addItem('kernelName', Toolbar.createKernelNameItem(panel.session));
    toolbar.addItem('kernelStatus', Toolbar.createKernelStatusItem(panel.session));
  }

}
