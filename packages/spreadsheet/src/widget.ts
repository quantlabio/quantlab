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
const DIRTY_CLASS = 'jp-mod-dirty';

/**
 * The timeout to wait for change activity to have ceased before rendering.
 */
const RENDER_TIMEOUT = 1000;

/**
 * filter item interface
 */
interface filterItem {
  row: number;
  col: number;
}

class hotModel {
  data: any[];
  cell?: any[];
  colWidths?: any[]|Function|number|string;
  customBorders?: boolean|any[];
  mergeCells?: boolean|any[];
  style: any[];
}

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

    const context = this._context = options.context;

    this.addClass(SPREADSHEET_CLASS);

    context.pathChanged.connect(this._onPathChanged, this);
    context.ready.then(() => { this._onContextReady(); });
    this._onPathChanged();
/*
    if(context){

      this._context.ready.then(() => {
        const contextModel = this._context.model;

        this._handleDirtyState();

        // Wire signal connections.
        contextModel.stateChanged.connect(this._onModelStateChanged, this);
        contextModel.contentChanged.connect(this._onContentChanged, this);

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
*/
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
   * Handle actions that should be taken when the context is ready.
   */
  private _onContextReady(): void {
    if (this.isDisposed) {
      return;
    }
    const contextModel = this._context.model;

    // Resolve the ready promise.
    this._ready.resolve(undefined);

    this._updateSpreadsheet();

    // Throttle the rendering rate of the widget.
    this._monitor = new ActivityMonitor({
      signal: contextModel.contentChanged,
      timeout: RENDER_TIMEOUT
    });
    this._monitor.activityStopped.connect(this._updateSpreadsheet, this);
  }

  /**
   * get spreadsheet model
   */
  modelString(): string{
    const opts: Handsontable.Options = this._sheet.getSettings();
    let hot = new hotModel();
    hot.data = this._sheet.getSourceData();
    hot.cell = opts.cell;
    hot.colWidths = opts.colWidths
    hot.customBorders = opts.customBorders;
    hot.mergeCells = opts.mergeCells;
    hot.style = [];
    return JSON.stringify(hot, null, 4);
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
    this._sheet.destroy();
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
    let contextModel = this._context.model;
    let title = this.title;
    let content = JSON.parse(contextModel.toString());
    const container = document.getElementById(this.id);

    if(this._sheet != null){
      this._sheet.destroy();
    }

    this._sheet = new Handsontable(container, {
      data: content.data,
      rowHeaders: true,
      colHeaders: true,
      manualColumnResize: true,
      manualRowResize: true,
      minRows: 128,
      minCols: 32,
      colWidths: content.colWidths,
      //rowHeights: content.rowHeights,
      contextMenu: true,
      formulas: true,
      comments: true,
      //columnSorting: true,
      //sortIndicator: true,
      mergeCells: content.mergeCells,
      customBorders: content.customBorders,
      cell: content.cell,
      cells: function(row: number, col: number, prop:any){
        var cellProperties = {};
        cellProperties = content.cell.filter( (item:filterItem) => item.row === row && item.col === col)[0];
        return cellProperties;
      },
      afterChange: function(changes: Array<[number, number|string, any, any]>, source?: string) {
        if (source != 'loadData'){
          if(!contextModel.dirty){
            contextModel.dirty = true;
            title.className += ` ${DIRTY_CLASS}`;
          }
        }
      }
    });

    this._sheet.formula.parser.setFunction('FOO', () => 1234);
    this._sheet.formula.parser.setFunction('BAR', (params:any) => params[0] + params[1]);

    this._sheet.render();
  }

  private _context: DocumentRegistry.Context = null;
  private _ready = new PromiseDelegate<void>();
  private _monitor: ActivityMonitor<any, any> = null;
  private _sheet: Handsontable = null;
}

/**
 * The namespace for `Spreadsheet` class statics.
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
