// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  ISpreadsheetModel
} from './model';

import * as Handsontable
  from '@quantlab/handsontable';

/**
 * The class name added to a spreadsheet widget.
 */
//const SPREADSHEET_CLASS = 'jp-Spreadsheet';


/**
 * A widget which manages a spreadsheet session.
 */
export
class Spreadsheet extends Widget {
  /**
   * Construct a new spreadsheet widget.
   *
   * @param options - The spreadsheet configuration options.
   */
  constructor(options: Spreadsheet.IOptions) {
    super();
    //this.addClass(SPREADSHEET_CLASS);

  }

  /**
   * A signal emitted when the model of the notebook changes.
   */
  get modelChanged(): ISignal<this, void> {
    return this._modelChanged;
  }

  /**
   * A signal emitted when the model content changes.
   *
   * #### Notes
   * This is a convenience signal that follows the current model.
   */
  get modelContentChanged(): ISignal<this, void> {
    return this._modelContentChanged;
  }

  /**
   * The cell factory used by the widget.
   */
  readonly contentFactory: Spreadsheet.IContentFactory;

  /**
   * The model for the widget.
   */
  get model(): ISpreadsheetModel {
    return this._model;
  }
  set model(newValue: ISpreadsheetModel) {
    newValue = newValue || null;
    if (this._model === newValue) {
      return;
    }
    let oldValue = this._model;
    this._model = newValue;

    if (oldValue && oldValue.modelDB.isCollaborative) {
      oldValue.modelDB.connected.then(() => {
        oldValue.modelDB.collaborators.changed.disconnect(
          this._onCollaboratorsChanged, this);
      });
    }
    if (newValue && newValue.modelDB.isCollaborative) {
      newValue.modelDB.connected.then(() => {
        newValue.modelDB.collaborators.changed.connect(
          this._onCollaboratorsChanged, this);
      });
    }

    // Trigger private, protected, and public changes.
    this._onModelChanged(oldValue, newValue);
    this.onModelChanged(oldValue, newValue);
    this._modelChanged.emit(void 0);
  }

  get activeCell(): any {
    return this._activeCell;
  }

  /**
   * A signal emitted when the selection state of the notebook changes.
   */
  get selectionChanged(): ISignal<this, void> {
    return this._selectionChanged;
  }

  /**
   * A signal emitted when the active cell changes.
   *
   */
  get activeCellChanged(): ISignal<this, void> {
    return this._activeCellChanged;
  }

  /**
   * Handle a new model.
   *
   * #### Notes
   * This method is called after the model change has been handled
   * internally and before the `modelChanged` signal is emitted.
   * The default implementation is a no-op.
   */
  protected onModelChanged(oldValue: ISpreadsheetModel, newValue: ISpreadsheetModel): void {
    // No-op.
  }

  /**
   * Handle changes to the notebook model content.
   *
   * #### Notes
   * The default implementation emits the `modelContentChanged` signal.
   */
  protected onModelContentChanged(model: ISpreadsheetModel, args: void): void {
    this._modelContentChanged.emit(void 0);
  }

  /**
   * Handle a new model on the widget.
   */
  private _onModelChanged(oldValue: ISpreadsheetModel, newValue: ISpreadsheetModel): void {
    if (oldValue) {
      oldValue.contentChanged.disconnect(this.onModelContentChanged, this);
    }

    newValue.contentChanged.connect(this.onModelContentChanged, this);
  }

  /**
   * get spreadsheet model
   */
  modelJSON(): any{
    const opts: Handsontable.Options = this._sheet.getSettings();
    let hot = new hotModel();
    hot.data = this._sheet.getSourceData();
    hot.cell = opts.cell;
    hot.colWidths = opts.colWidths
    hot.customBorders = opts.customBorders;
    hot.mergeCells = opts.mergeCells;
    //return JSON.stringify(hot, null, 4);
    return hot;
  }

  /**
   * spreadsheet format functions
   */
  style(property:string, value:string): void {
    let parent = this;
    let cell = this._sheet.getSettings().cell;

    let r:number, c:number, r1:number, r2:number, c1:number, c2:number;
    if(parent._r1 <= parent._r2){
      r1 = parent._r1;
      r2 = parent._r2;
    }else{
      r1 = parent._r2;
      r2 = parent._r1;
    }
    if(parent._c1 <= parent._c2){
      c1 = parent._c1;
      c2 = parent._c2;
    }else{
      c1 = parent._c2;
      c2 = parent._c1;
    }
    for(r = r1; r <= r2; r++){
      for(c = c1; c <= c2; c++){
        let existing = cell.filter( (item:filterItem) => item.row === r && item.col === c)[0];
        if(existing != null && existing != undefined){
          if(existing.hasOwnProperty(property) && existing[property] == value)
            existing[property] = '';
          else
            existing[property] = value;
        }else{
          let cellStyle:any = {};
          cellStyle['row'] = r;
          cellStyle['col'] = c;
          cellStyle[property] = value;
          cell.push(cellStyle);
        }
      }
    }

    this._sheet.updateSettings({cell: cell});
    this._model.dirty = true;
  }

  /**
   * Dispose of the resources held by the sheet widget.
   */
  dispose(): void {
    // Do nothing if already disposed.
    if (this.isDisposed) {
      return;
    }
    this._model = null;
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

  protected onResize(msg: Widget.ResizeMessage): void {
    if(this._sheet != null)
      this._sheet.updateSettings({width:msg.width, height:msg.height});
  }

  createSheet(pwid:any): void {
    let contextModel = this._model;
    let content:any = {};

    if(contextModel.toString() == ''){
      content.colWidths = 100;
      content.data = [[]];
      content.cell = [];
    } else {
      content = JSON.parse(contextModel.toString());
    }

    content.cells = [];

    const container = document.getElementById(pwid).children[1];

    if(this._sheet != null){
      this._sheet.destroy();
    }

    let parent = this;

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
      outsideClickDeselects: false,
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
          parent._model.dirty = true;
        }
      }
    });

    this._sheet.addHook('afterSelection',function(r1: number, c1: number, r2: number, c2: number, preventScrolling:boolean){
      parent._activeCell = parent._sheet.getDataAtCell(r1,c1);
      parent._r1 = r1;
      parent._r2 = r2;
      parent._c1 = c1;
      parent._c2 = c2;
    });

    this._sheet.formula.parser.setFunction('SYMMETRICSCHURDECOMPOSITION', (params:any) => params[0] + params[1]);

    this._sheet.formula.parser.setFunction('SYMMETRICSCHURDECOMPOSITIONEIGENVALUES', (params:any) => params[0] + params[1]);

    this._sheet.render();
  }

  /**
   * Handle an update to the collaborators.
   */
  private _onCollaboratorsChanged(): void {
    // If there are selections corresponding to non-collaborators,
    // they are stale and should be removed.
    //for (let i = 0; i < this.widgets.length; i++) {
      //let cell = this.widgets[i];
      //for (let key of cell.model.selections.keys()) {
        //if (!this._model.modelDB.collaborators.has(key)) {
          //cell.model.selections.delete(key);
        //}
      //}
    //}
  }

  private _model: ISpreadsheetModel = null;
  private _sheet: Handsontable = null;
  private _activeCell: any = null;
  private _modelChanged = new Signal<this, void>(this);
  private _modelContentChanged = new Signal<this, void>(this);
  private _selectionChanged = new Signal<this, void>(this);
  private _activeCellChanged = new Signal<this, void>(this);
  private _r1: number;
  private _c1: number;
  private _r2: number;
  private _c2: number
}

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
}

/**
 * The namespace for `Spreadsheet` class statics.
 */
export
namespace Spreadsheet {
  /**
   * Options for the spreadsheet widget.
   */
  export
  interface IOptions {


  }

  /**
   * A factory for creating spreadsheet content.
   *
   */
  export
  interface IContentFactory {

  }

}
