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
  SpreadsheetPanel
} from './panel';

import {
  Spreadsheet
} from './widget';

/**
 * The class name added to toolbar save button.
 */
const TOOLBAR_SAVE_CLASS = 'jp-SaveIcon';

const TOOLBAR_LABEL_CLASS = 'jp-Toolbar-label';

const TOOLBAR_DROPDOWN_CLASS = 'jp-Spreadsheet-toolbarDropdown';

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
   * Create align left button toolbar item.
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
   * Create align left button toolbar item.
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

  export
  function createFillColorItem(panel: SpreadsheetPanel): Widget {
    return new ColorSwitcher(panel.spreadsheet,'Fill Color');
  }
  export
  function createFontColorItem(panel: SpreadsheetPanel): Widget {
    return new ColorSwitcher(panel.spreadsheet,'Font Color');
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

    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    toolbar.addItem('kernelName', Toolbar.createKernelNameItem(panel.session));
    toolbar.addItem('kernelStatus', Toolbar.createKernelStatusItem(panel.session));
  }

}


/**
 * A toolbar widget that switches fill or font color
 */
class ColorSwitcher extends Widget {
  /**
   * Construct a new color switcher.
   */
  constructor(widget: Spreadsheet, prompt: string) {
    super({ node: createColorSwitcherNode(prompt) });
    //this.addClass(TOOLBAR_COLOR_CLASS);

    this._select = this.node.firstChild as HTMLSelectElement;
    Styling.wrapSelect(this._select);
    this._wildCard = document.createElement('option');
    this._wildCard.value = '-';
    this._wildCard.textContent = '-';
    this._spreadsheet = widget;

    // Set the initial value.
    if (widget.model) {
      this._updateValue();
    }

    // Follow the type of the active cell.
    widget.activeCellChanged.connect(this._updateValue, this);

    // Follow a change in the selection.
    widget.selectionChanged.connect(this._updateValue, this);
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the dock panel's node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'change':
      this._evtChange(event);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    default:
      break;
    }
  }

  /**
   * Handle `after-attach` messages for the widget.
   */
  protected onAfterAttach(msg: Message): void {
    this._select.addEventListener('change', this);
    this._select.addEventListener('keydown', this);
  }

  /**
   * Handle `before-detach` messages for the widget.
   */
  protected onBeforeDetach(msg: Message): void {
    this._select.removeEventListener('change', this);
    this._select.removeEventListener('keydown', this);
  }

  /**
   * Handle `changed` events for the widget.
   */
  private _evtChange(event: Event): void {
    let select = this._select;
    let widget = this._spreadsheet;
    if (select.value === '-') {
      return;
    }
    if (!this._changeGuard) {
      let value = select.value;
      if(select.options[0].textContent == 'Fill Color'){
        widget.style('background', value);
        select.value = '';
      }else if(select.options[0].textContent == 'Font Color'){
        widget.style('color', value);
        select.value = '';
      }
      widget.activate();
    }
  }

  /**
   * Handle `keydown` events for the widget.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    if (event.keyCode === 13) {  // Enter
      this._spreadsheet.activate();
    }
  }

  /**
   * Update the value of the dropdown from the widget state.
   */
  private _updateValue(): void {
    let widget = this._spreadsheet;
    let select = this._select;
    if (!widget.activeCell) {
      return;
    }
    let mColor: string = '';//widget.activeCell.model.type;
    //for (let i = 0; i < widget.widgets.length; i++) {
    //  let child = widget.widgets[i];
    //  if (widget.isSelected(child)) {
    //    if (child.model.type !== mType) {
    //      mType = '-';
    //      select.appendChild(this._wildCard);
    //      break;
    //    }
    //  }
    //}
    if (mColor !== '-') {
      select.remove(3);
    }
    this._changeGuard = true;
    select.value = mColor;
    this._changeGuard = false;

  }

  private _changeGuard = false;
  private _wildCard: HTMLOptionElement = null;
  private _select: HTMLSelectElement = null;
  private _spreadsheet: Spreadsheet = null;
}


/**
 * Create the node for the cell type switcher.
 */
function createColorSwitcherNode(prompt: string): HTMLElement {
  let div = document.createElement('div');
  let label = document.createElement('span');
  label.textContent = prompt;
  label.className = TOOLBAR_LABEL_CLASS;
  let select = document.createElement('select');
  for (let t of [prompt, 'red', 'yellow', 'blue']) {
    let option = document.createElement('option');
    option.value = t.toLowerCase();

    if(option.value == prompt.toLowerCase()){
      option.textContent = prompt;
      option.value = '';
    }else{
      option.style.background = t;
    }

    select.appendChild(option);
  }
  select.className = TOOLBAR_DROPDOWN_CLASS;
  //div.appendChild(label);
  //let node = Styling.wrapSelect(select);
  //node.classList.add(TOOLBAR_DROPDOWN_CLASS);
  div.appendChild(select);
  return div;
}
