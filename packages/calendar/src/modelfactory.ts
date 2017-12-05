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
  ICalendarModel, CalendarModel
} from './model';


/**
 * A model factory for Calendar.
 */
export
class CalendarModelFactory implements DocumentRegistry.IModelFactory<ICalendarModel> {
  /**
   * Construct a new Calendar model factory.
   */
  constructor(options: CalendarModelFactory.IOptions) {
    this.contentFactory = (options.contentFactory ||
      new CalendarModel.ContentFactory({ })
    );
  }

  /**
   * The content model factory used by the CalendarModelFactory.
   */
  readonly contentFactory: CalendarModel.IContentFactory;

  /**
   * The name of the model.
   */
  get name(): string {
    return 'calendar';
  }

  /**
   * The content type of the file.
   */
  get contentType(): Contents.ContentType {
    return 'calendar';
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
  createNew(languagePreference?: string, modelDB?: IModelDB): ICalendarModel {
    let contentFactory = this.contentFactory;
    return new CalendarModel({ languagePreference, contentFactory, modelDB });
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
 * The namespace for Calendar model factory statics.
 */
export
namespace CalendarModelFactory {
  /**
   * The options used to initialize a CalendarModelFactory.
   */
  export
  interface IOptions {

    /**
     * The content factory used by the CalendarModelFactory.
     */
    contentFactory?: CalendarModel.IContentFactory;
  }
}
