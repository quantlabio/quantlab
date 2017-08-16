// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IInstanceTracker, InstanceTracker
} from '@quantlab/apputils';

import {
  Cell
} from '@quantlab/cells';

import {
  Token
} from '@phosphor/coreutils';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Spreadsheet
} from './';


/**
 * An object that tracks spreadsheet widgets.
 */
export
interface ISpreadsheetTracker extends IInstanceTracker<Spreadsheet> {
  /**
   * The currently focused cell.
   *
   * #### Notes
   * If there is no cell with the focus, then this value is `null`.
   */
  readonly activeCell: Cell;

  /**
   * A signal emitted when the current active cell changes.
   *
   * #### Notes
   * If there is no cell with the focus, then `null` will be emitted.
   */
  readonly activeCellChanged: ISignal<this, Cell>;

  /**
   * A signal emitted when the selection state changes.
   */
  readonly selectionChanged: ISignal<this, void>;
}


/* tslint:disable */
/**
 * The spreadsheet tracker token.
 */
export
const ISpreadsheetTracker = new Token<ISpreadsheetTracker>('jupyter.services.spreadsheets');
/* tslint:enable */


export
class SpreadsheetTracker extends InstanceTracker<Spreadsheet> implements ISpreadsheetTracker {
  /**
   * The currently focused cell.
   *
   * #### Notes
   * This is a read-only property. If there is no cell with the focus, then this
   * value is `null`.
   */
  get activeCell(): Cell {
    let widget = this.currentWidget;
    if (!widget) {
      return null;
    }
    return widget.activeCell || null;
  }

  /**
   * A signal emitted when the current active cell changes.
   *
   * #### Notes
   * If there is no cell with the focus, then `null` will be emitted.
   */
  get activeCellChanged(): ISignal<this, Cell> {
    return this._activeCellChanged;
  }

  /**
   * A signal emitted when the selection state changes.
   */
  get selectionChanged(): ISignal<this, void> {
    return this._selectionChanged;
  }

  /**
   * Add a new spreadsheet panel to the tracker.
   *
   * @param panel - The spreadsheet panel being added.
   */
  add(sheet: Spreadsheet): Promise<void> {
    const promise = super.add(sheet);
    sheet.activeCellChanged.connect(this._onActiveCellChanged, this);
    sheet.selectionChanged.connect(this._onSelectionChanged, this);
    return promise;
  }

  /**
   * Dispose of the resources held by the tracker.
   */
  dispose(): void {
    this._activeCell = null;
    super.dispose();
  }

  /**
   * Handle the current change event.
   */
  protected onCurrentChanged(widget: Spreadsheet): void {
    // Store an internal reference to active cell to prevent false positives.
    let activeCell = this.activeCell;
    if (activeCell && activeCell === this._activeCell) {
      return;
    }
    this._activeCell = activeCell;

    if (!widget) {
      return;
    }

    // Since the spreadsheet has changed, immediately signal an active cell change
    this._activeCellChanged.emit(widget.activeCell || null);
  }

  private _onActiveCellChanged(sender: Spreadsheet, cell: Cell): void {
    // Check if the active cell change happened for the current spreadsheet.
    if (this.currentWidget && this.currentWidget === sender) {
      this._activeCell = cell || null;
      this._activeCellChanged.emit(this._activeCell);
    }
  }

  private _onSelectionChanged(sender: Spreadsheet): void {
    // Check if the selection change happened for the current spreadsheet.
    if (this.currentWidget && this.currentWidget === sender) {
      this._selectionChanged.emit(void 0);
    }
  }

  private _activeCell: Cell | null = null;
  private _activeCellChanged = new Signal<this, Cell>(this);
  private _selectionChanged = new Signal<this, void>(this);
}
