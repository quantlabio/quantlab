// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JSONObject
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  IModelDB, ModelDB, IObservableValue, ObservableValue,
  IObservableMap, IChangedArgs
} from '@quantlab/coreutils';


  /**
   * A zero-based position in the editor.
   */
  export
  interface IPosition extends JSONObject {
    /**
     * The cell row number.
     */
    readonly row: number;

    /**
     * The cell column number.
     */
    readonly col: number;
  }

  /**
   * A range.
   */
  export
  interface IRange extends JSONObject {
    /**
     * The position of the first cell in the current range.
     *
     * #### Notes
     * If this position is greater than [end] then the range is considered
     * to be backward.
     */
    readonly start: IPosition;

    /**
     * The position of the last cell in the current range.
     *
     * #### Notes
     * If this position is less than [start] then the range is considered
     * to be backward.
     */
    readonly end: IPosition;
  }

  /**
   * A cell selection.
   */
  export
  interface ICellSelection extends IRange {
    /**
     * The uuid of the text selection owner.
     */
    readonly uuid: string;

  }

  /**
   * A spreadsheet model.
   */
  export
  interface IModel extends IDisposable {
    /**
     * A signal emitted when data changes.
     */
    sheetChanged: ISignal<IModel, IChangedArgs<string>>;

    /**
     * The cell data stored in the model.
     */
    readonly value: IObservableValue;

    /**
     * The currently selected code.
     */
    readonly selections: IObservableMap<ICellSelection[]>;

    /**
     * The underlying `IModelDB` instance in which model
     * data is stored.
     */
    readonly modelDB: IModelDB;
  }

  /**
   * The default implementation of the spreadsheet model.
   */
  export
  class SheetModel implements IModel {
    /**
     * Construct a new Model.
     */
    constructor(options?: SheetModel.IOptions) {
      options = options || {};

      if (options.modelDB) {
        this.modelDB = options.modelDB;
      } else {
        this.modelDB = new ModelDB();
      }

      let value = this.modelDB.createValue('value');
      value.set(options.value);
      value.changed.connect(this._onSheetChanged, this);
    }

    /**
     * The underlying `IModelDB` instance in which model
     * data is stored.
     */
    readonly modelDB: IModelDB;

    /**
     * A signal emitted when a sheet data changes.
     */
    get sheetChanged(): ISignal<this, IChangedArgs<string>> {
      return this._sheetChanged;
    }

    /**
     * Get the data of the model.
     */
    get value(): IObservableValue {
      return this.modelDB.get('value') as IObservableValue;
    }

    /**
     * Get the selections for the model.
     */
    get selections(): IObservableMap<ICellSelection[]> {
      return this.modelDB.get('selections') as IObservableMap<ICellSelection[]>;
    }

    /**
     * Whether the model is disposed.
     */
    get isDisposed(): boolean {
      return this._isDisposed;
    }

    /**
     * Dipose of the resources used by the model.
     */
    dispose(): void {
      if (this._isDisposed) {
        return;
      }
      this._isDisposed = true;
      Signal.clearData(this);
    }

    private _onSheetChanged(sheet: IObservableValue, args: ObservableValue.IChangedArgs): void {
      this._sheetChanged.emit({
        name: 'sheet',
        oldValue: args.oldValue as string,
        newValue: args.newValue as string
      });
    }

    private _isDisposed = false;
    private _sheetChanged = new Signal<this, IChangedArgs<string>>(this);
  }

  export
  namespace SheetModel {
    export
    interface IOptions {
      /**
       * The initial value of the model.
       */
      value?: string;

      /**
       * An optional modelDB for storing model state.
       */
      modelDB?: IModelDB;
    }
  }
