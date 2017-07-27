// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  PathExt
} from '@quantlab/coreutils';

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  ActivityMonitor
} from '@quantlab/coreutils';

import {
  ABCWidgetFactory, DocumentRegistry
} from '@quantlab/docregistry';

import * as Handsontable
  from '@quantlab/handsontable';

/**
 * The class name added to a spreadsheet widget.
 */
const SPREADSHEET_CLASS = 'jp-Spreadsheet';

/**
 * The class name added to a dirty widget.
 */
//const DIRTY_CLASS = 'jp-mod-dirty';

/**
 * The timeout to wait for change activity to have ceased before rendering.
 */
const RENDER_TIMEOUT = 1000;

/**
 * A widget which manages a spreadsheet session.
 */
export
class Spreadsheet extends Widget implements DocumentRegistry.IReadyWidget {
  /**
   * Construct a new spreadsheet widget.
   *
   * @param options - The spreadsheet configuration options.
   */
  constructor(options: Spreadsheet.IOptions) {
    super();

    this.addClass(SPREADSHEET_CLASS);

    let context = this._context = options.context;

    if(context){
      this.title.label = context.path.split('/').pop();
      context.pathChanged.connect(this._onPathChanged, this);

      this._context.ready.then(() => {
        //this._onContextReady();
        this._updateSpreadsheet();
        this._ready.resolve(undefined);
        // Throttle the rendering rate of the widget.
        this._monitor = new ActivityMonitor({
          signal: context.model.contentChanged,
          timeout: RENDER_TIMEOUT
        });
        this._monitor.activityStopped.connect(this._updateSpreadsheet, this);
      });
    }else{
      this.title.label = 'Spreadsheet';
    }

  }

  /**
   * The Sheet widget's context.
   */
  get context(): DocumentRegistry.Context {
    return this._context;
  }

  /**
   * A promise that resolves when the sheet is ready.
   */
  get ready() {
    return this._ready.promise;
  }

  /**
   * Dispose of the resources held by the sheet widget.
   */
  dispose(): void {
    let monitor = this._monitor;
    this._monitor = null;
    if (monitor) {
      monitor.dispose();
    }
    super.dispose();
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this.node.tabIndex = -1;
    this.node.focus();
  }

  /**
   * Handle a change in path.
   */
  private _onPathChanged(): void {
    const path = this._context.path;
    this.title.label = PathExt.basename(path.split(':').pop()!);
  }

  /**
   * Create the json model for the sheet.
   */
  private _updateSpreadsheet(): void {
    let content = this._context.model.toString();
    let container = document.getElementById(this.id);
    this._sheet = new Handsontable(container, {
      data: JSON.parse(content),
      rowHeaders: true,
      colHeaders: true,
      manualColumnResize: true,
      manualRowResize: true,
      minRows: 128,
      minCols: 32,
      colWidths: 100,
      contextMenu: true,
      //formulas: true,
      outsideClickDeselects: false
    });

  }

  private _context: DocumentRegistry.Context = null;
  private _ready = new PromiseDelegate<void>();
  private _monitor: ActivityMonitor<any, any> = null;
  private _sheet: Handsontable = null;
}

/**
 * The namespace for `sheet` class statics.
 */
export
namespace Spreadsheet {
  /**
   * Options for the sheet widget.
   */
  export
  interface IOptions {
  /**
   * The document context for the Spreadsheet being rendered by the widget.
   */
  context: DocumentRegistry.Context;

  }
}

/**
 * A widget factory for Spreadsheet widgets.
 */
export
class SpreadsheetFactory extends ABCWidgetFactory<Spreadsheet, DocumentRegistry.IModel> {
  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.Context): Spreadsheet {
    return new Spreadsheet({ context });
  }
}
