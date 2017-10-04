// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Widget
} from '@phosphor/widgets';

import {
  Toolbar, ToolbarButton
} from '@quantlab/apputils';

import {
  SpreadsheetPanel
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
  function createSaveButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: TOOLBAR_SAVE_CLASS,
      onClick: () => {
        panel.context.model.fromJSON(panel.spreadsheet.modelJSON());
        panel.context.save().then(() => {
          if (!panel.isDisposed) {
            return panel.context.createCheckpoint();
          }
        });
      },
      tooltip: 'Save the spreadsheet contents and create checkpoint'
    });
  }

  /**
   * Create bold button toolbar item.
   */
  export
  function createBoldButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: 'fa fa-bold',
      onClick: () => {
        panel.spreadsheet.style('fontWeight','bold');
      },
      tooltip: 'Set font weight to Bold'
    });
  }

  /**
   * Create italic button toolbar item.
   */
  export
  function createItalicButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: 'fa fa-italic',
      onClick: () => {
        panel.spreadsheet.style('fontStyle','italic');
      },
      tooltip: 'Set font style to Italic'
    });
  }

  /**
   * Create align left button toolbar item.
   */
  export
  function createAlignLeftButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: 'fa fa-align-left',
      onClick: () => {
        panel.spreadsheet.style('className','htLeft');
      },
      tooltip: 'Align to left'
    });
  }

  /**
   * Create align center button toolbar item.
   */
  export
  function createAlignCenterButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: 'fa fa-align-center',
      onClick: () => {
        panel.spreadsheet.style('className','htCenter');
      },
      tooltip: 'Align to center'
    });
  }

  /**
   * Create align right button toolbar item.
   */
  export
  function createAlignRightButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: 'fa fa-align-right',
      onClick: () => {
        panel.spreadsheet.style('className','htRight');
      },
      tooltip: 'Align to right'
    });
  }

  /**
   * Create Re-Calculate button toolbar item.
   */
  export
  function createReCalculateButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: 'fa fa-refresh',
      onClick: () => {
        panel.spreadsheet.recalculate();
      },
      tooltip: 'Re-Calculate'
    });
  }

  /**
   * Create chart button toolbar item.
   */
  export
  function createChartButton(panel: SpreadsheetPanel): ToolbarButton {
    return new ToolbarButton({
      className: 'fa fa-line-chart',
      onClick: () => {

      },
      tooltip: 'Create Charts'
    });
  }

  export
  function createFillColorItem(panel: SpreadsheetPanel): Widget {
    let fillColor = document.createElement('input');
    return new Widget({node:fillColor});
  }
  export
  function createFontColorItem(panel: SpreadsheetPanel): Widget {
    let fontColor = document.createElement('input');
    return new Widget({node:fontColor});
  }

  /**
   * Add the default items to the panel toolbar.
   */
  export
  function populateDefaults(panel: SpreadsheetPanel): void {
    let toolbar = panel.toolbar;
    toolbar.addItem('save', createSaveButton(panel));
    toolbar.addItem('interrupt', Toolbar.createInterruptButton(panel.session));
    toolbar.addItem('restart', Toolbar.createRestartButton(panel.session));

    toolbar.addItem('bold', createBoldButton(panel));
    toolbar.addItem('italic', createItalicButton(panel));
    toolbar.addItem('left', createAlignLeftButton(panel));
    toolbar.addItem('center', createAlignCenterButton(panel));
    toolbar.addItem('right', createAlignRightButton(panel));

    toolbar.addItem('fill', createFillColorItem(panel));
    toolbar.addItem('font', createFontColorItem(panel));

    toolbar.addItem('recalculate', createReCalculateButton(panel));
    toolbar.addItem('chart', createChartButton(panel));

    //let fx = document.createElement('input') as HTMLElement;
    //let fxw = new Widget({node:fx});
    //toolbar.addItem('fx', fxw);

    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    toolbar.addItem('kernelName', Toolbar.createKernelNameItem(panel.session));
    toolbar.addItem('kernelStatus', Toolbar.createKernelStatusItem(panel.session));
  }

}
