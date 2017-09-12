// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  DocumentModel, DocumentRegistry
} from '@quantlab/docregistry';

import {
  IObservableJSON, nbformat, IModelDB
} from '@quantlab/coreutils';


/**
 * The definition of a model object for a Calendar widget.
 */
export
interface ICalendarModel extends DocumentRegistry.IModel {
  /**
   * The content factory for the Calendar.
   */
  readonly contentFactory: CalendarModel.IContentFactory;

  /**
   * The major version number of the nbformat.
   */
  readonly nbformat: number;

  /**
   * The minor version number of the nbformat.
   */
  readonly nbformatMinor: number;

  /**
   * The metadata associated with the Calendar.
   */
  readonly metadata: IObservableJSON;
}


/**
 * An implementation of a Calendar Model.
 */
export
class CalendarModel extends DocumentModel implements ICalendarModel {
  /**
   * Construct a new Calendar model.
   */
  constructor(options: CalendarModel.IOptions = {}) {
    super(options.languagePreference, options.modelDB);
    let factory = (
      options.contentFactory || CalendarModel.defaultContentFactory
    );
    let cellDB = this.modelDB.view('data');
    factory.modelDB = cellDB;
    this.contentFactory = factory;

    // Handle initial metadata.
    let metadata = this.modelDB.createMap('metadata');
    if (!metadata.has('language_info')) {
      let name = options.languagePreference || '';
      metadata.set('language_info', { name });
    }
    this._ensureMetadata();
    metadata.changed.connect(this.triggerContentChange, this);
  }

  /**
   * The cell model factory for the Calendar.
   */
  readonly contentFactory: CalendarModel.IContentFactory;

  /**
   * The metadata associated with the Calendar.
   */
  get metadata(): IObservableJSON {
    return this.modelDB.get('metadata') as IObservableJSON;
  }

  /**
   * The major version number of the nbformat.
   */
  get nbformat(): number {
    return this._nbformat;
  }

  /**
   * The minor version number of the nbformat.
   */
  get nbformatMinor(): number {
    return this._nbformatMinor;
  }

  /**
   * The default kernel name of the document.
   */
  get defaultKernelName(): string {
    let spec = this.metadata.get('kernelspec') as nbformat.IKernelspecMetadata;
    return spec ? spec.name : '';
  }

  /**
   * The default kernel language of the document.
   */
  get defaultKernelLanguage(): string {
    let info = this.metadata.get('language_info') as nbformat.ILanguageInfoMetadata;
    return info ? info.name : '';
  }

  /**
   * Dispose of the resources held by the model.
   */
  dispose(): void {

    super.dispose();
  }

  /**
   * Serialize the model to a string.
   */
  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Deserialize the model from a string.
   *
   * #### Notes
   * Should emit a [contentChanged] signal.
   */
  fromString(value: string): void {
    this.fromJSON(JSON.parse(value));
  }

  /**
   * Serialize the model to JSON.
   */
  toJSON(): any {

    this._ensureMetadata();
    let metadata = Object.create(null) as nbformat.INotebookMetadata;
    for (let key of this.metadata.keys()) {
      metadata[key] = JSON.parse(JSON.stringify(this.metadata.get(key)));
    }
    return {
      metadata,
      nbformat_minor: this._nbformatMinor,
      nbformat: this._nbformat
    };
  }

  /**
   * Deserialize the model from JSON.
   *
   * #### Notes
   * Should emit a [contentChanged] signal.
   */
  fromJSON(value: any): void {

    let oldValue = 0;
    let newValue = 0;
    this._nbformatMinor = nbformat.MINOR_VERSION;
    this._nbformat = nbformat.MAJOR_VERSION;

    if (value.nbformat !== this._nbformat) {
      oldValue = this._nbformat;
      this._nbformat = newValue = value.nbformat;
      this.triggerStateChange({ name: 'nbformat', oldValue, newValue });
    }
    if (value.nbformat_minor > this._nbformatMinor) {
      oldValue = this._nbformatMinor;
      this._nbformatMinor = newValue = value.nbformat_minor;
      this.triggerStateChange({ name: 'nbformatMinor', oldValue, newValue });
    }
    // Update the metadata.
    this.metadata.clear();
    let metadata = value.metadata;
    for (let key in metadata) {
      // orig_nbformat is not intended to be stored per spec.
      if (key === 'orig_nbformat') {
        continue;
      }
      this.metadata.set(key, metadata[key]);
    }
    this._ensureMetadata();

    this.dirty = true;
  }

  /**
   * Make sure we have the required metadata fields.
   */
  private _ensureMetadata(): void {
    let metadata = this.metadata;
    if (!metadata.has('language_info')) {
      metadata.set('language_info', { name: '' });
    }
    if (!metadata.has('kernelspec')) {
      metadata.set('kernelspec', { name: '', display_name: '' });
    }
  }

  private _nbformat = nbformat.MAJOR_VERSION;
  private _nbformatMinor = nbformat.MINOR_VERSION;
}


/**
 * The namespace for the `CalendarModel` class statics.
 */
export
namespace CalendarModel {
  /**
   * An options object for initializing a Calendar model.
   */
  export
  interface IOptions {
    /**
     * The language preference for the model.
     */
    languagePreference?: string;

    /**
     * A factory for creating Calendar models.
     *
     * The default is a shared factory instance.
     */
    contentFactory?: IContentFactory;

    /**
     * An optional modelDB for storing Calendar data.
     */
    modelDB?: IModelDB;
  }

  /**
   * A factory for creating Calendar model content.
   */
  export
  interface IContentFactory {

    modelDB: IModelDB;

  }

  /**
   * The default implementation of an `IContentFactory`.
   */
  export
  class ContentFactory {
    /**
     * Create a new content factory.
     */
    constructor(options: ContentFactory.IOptions) {

      this._modelDB = options.modelDB || null;
    }

    get modelDB(): IModelDB {
      return this._modelDB;
    }

    set modelDB(db: IModelDB) {
      this._modelDB = db;
    }

    private _modelDB: IModelDB;
  }

  /**
   * A namespace for the Calendar model content factory.
   */
  export
  namespace ContentFactory {
    /**
     * The options used to initialize a `ContentFactory`.
     */
    export
    interface IOptions {
      /**
       * The modelDB in which to place new content.
       */
      modelDB?: IModelDB;
    }
  }

  /**
   * The default `ContentFactory` instance.
   */
  export
  const defaultContentFactory = new ContentFactory({});
}
