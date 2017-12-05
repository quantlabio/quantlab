// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Contents
} from '@quantlab/services';

import {
  DocumentRegistry
} from '@quantlab/docregistry';

import {
  IModelDB
} from '@quantlab/observables';

import {
  ISpreadsheetModel, SpreadsheetModel
} from './model';


/**
 * A model factory for spreadsheets.
 */
export
class SpreadsheetModelFactory implements DocumentRegistry.IModelFactory<ISpreadsheetModel> {
  /**
   * Construct a new spreadsheet model factory.
   */
  constructor(options: SpreadsheetModelFactory.IOptions) {
    this.contentFactory = (options.contentFactory ||
      new SpreadsheetModel.ContentFactory({ })
    );
  }

  /**
   * The content model factory used by the SpreadsheetModelFactory.
   */
  readonly contentFactory: SpreadsheetModel.IContentFactory;

  /**
   * The name of the model.
   */
  get name(): string {
    return 'spreadsheet';
  }

  /**
   * The content type of the file.
   */
  get contentType(): Contents.ContentType {
    return 'spreadsheet';
  }

  /**
   * The format of the file.
   */
  get fileFormat(): Contents.FileFormat {
    return 'json';
  }

  /**
   * Get whether the model factory has been disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose of the model factory.
   */
  dispose(): void {
    this._disposed = true;
  }

  /**
   * Create a new model for a given path.
   *
   * @param languagePreference - An optional kernel language preference.
   *
   * @returns A new document model.
   */
  createNew(languagePreference?: string, modelDB?: IModelDB): ISpreadsheetModel {
    let contentFactory = this.contentFactory;
    return new SpreadsheetModel({ languagePreference, contentFactory, modelDB });
  }

  /**
   * Get the preferred kernel language given a path.
   */
  preferredLanguage(path: string): string {
    return '';
  }

  private _disposed = false;
}


/**
 * The namespace for spreadsheet model factory statics.
 */
export
namespace SpreadsheetModelFactory {
  /**
   * The options used to initialize a SpreadsheetModelFactory.
   */
  export
  interface IOptions {

    /**
     * The content factory used by the SpreadsheetModelFactory.
     */
    contentFactory?: SpreadsheetModel.IContentFactory;
  }
}
