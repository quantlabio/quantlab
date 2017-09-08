// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Contents
} from '@quantlab/services';

import {
  IModelDB
} from '@quantlab/coreutils';

import {
  DocumentRegistry
} from '@quantlab/docregistry';

import {
  IHighChartsModel, HighChartsModel
} from './model';


/**
 * A model factory for HighCharts.
 */
export
class HighChartsModelFactory implements DocumentRegistry.IModelFactory<IHighChartsModel> {
  /**
   * Construct a new HighCharts model factory.
   */
  constructor(options: HighChartsModelFactory.IOptions) {
    this.contentFactory = (options.contentFactory ||
      new HighChartsModel.ContentFactory({ })
    );
  }

  /**
   * The content model factory used by the HighChartsModelFactory.
   */
  readonly contentFactory: HighChartsModel.IContentFactory;

  /**
   * The name of the model.
   */
  get name(): string {
    return 'highcharts';
  }

  /**
   * The content type of the file.
   */
  get contentType(): Contents.ContentType {
    return 'highcharts';
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
  createNew(languagePreference?: string, modelDB?: IModelDB): IHighChartsModel {
    let contentFactory = this.contentFactory;
    return new HighChartsModel({ languagePreference, contentFactory, modelDB });
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
 * The namespace for HighCharts model factory statics.
 */
export
namespace HighChartsModelFactory {
  /**
   * The options used to initialize a HighChartsModelFactory.
   */
  export
  interface IOptions {

    /**
     * The content factory used by the HighChartsModelFactory.
     */
    contentFactory?: HighChartsModel.IContentFactory;
  }
}
