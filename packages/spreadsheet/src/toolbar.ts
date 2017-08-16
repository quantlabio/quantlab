// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  Styling, Toolbar, ToolbarButton
} from '@quantlab/apputils';

import {
  nbformat
} from '@quantlab/coreutils';

import {
  Spreadsheet
} from './widget';


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
  function createSaveButton(sheet: Spreadsheet): ToolbarButton {
    return new ToolbarButton({
      className: TOOLBAR_SAVE_CLASS,
      onClick: () => {
        sheet.context.save().then(() => {
          if (!panel.isDisposed) {
            return sheet.context.createCheckpoint();
          }
        });
      },
      tooltip: 'Save the spreadsheet contents and create checkpoint'
    });
  }

  /**
   * Add the default items to the panel toolbar.
   */
  export
  function populateDefaults(sheet: Spreadsheet): void {
    let toolbar = sheet.toolbar;
    toolbar.addItem('save', createSaveButton(panel));

    toolbar.addItem('kernelName', Toolbar.createKernelNameItem(panel.session));
    toolbar.addItem('kernelStatus', Toolbar.createKernelStatusItem(panel.session));
  }
  
}
