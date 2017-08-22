// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ABCWidgetFactory, DocumentRegistry
} from '@quantlab/docregistry';

import {
  ISpreadsheetModel
} from './model';

import {
  ToolbarItems
} from './toolbar';

import {
  SpreadsheetPanel
} from './panel';

/**
 * A widget factory for Spreadsheet panels.
 */
export
class SpreadsheetFactory extends ABCWidgetFactory<SpreadsheetPanel, ISpreadsheetModel> {
  /**
   * Construct a new spreadsheet widget factory.
   *
   * @param options - The options used to construct the factory.
   */
  constructor(options: SpreadsheetFactory.IOptions) {
    super(options);
    this.contentFactory = options.contentFactory;
  }

  /**
   * The content factory used by the widget factory.
   */
  readonly contentFactory: SpreadsheetPanel.IContentFactory;

  /**
   * Create a new widget.
   *
   * #### Notes
   * The factory will start the appropriate kernel and populate
   * the default toolbar items using `ToolbarItems.populateDefaults`.
   */
  protected createNewWidget(context: DocumentRegistry.IContext<ISpreadsheetModel>): SpreadsheetPanel {
    let panel = new SpreadsheetPanel({
      contentFactory: this.contentFactory
    });
    panel.context = context;
    ToolbarItems.populateDefaults(panel);
    return panel;
  }
}

/**
 * The namespace for `SpreadsheetFactory` statics.
 */
export
namespace SpreadsheetFactory {
  /**
   * The options used to construct a `SpreadsheetFactory`.
   */
  export
  interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {

    /**
     * A spreadsheet panel content factory.
     */
    contentFactory: SpreadsheetPanel.IContentFactory;

  }
}
