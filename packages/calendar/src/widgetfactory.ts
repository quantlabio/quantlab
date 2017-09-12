// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ABCWidgetFactory, DocumentRegistry
} from '@quantlab/docregistry';

import {
  ICalendarModel
} from './model';

import {
  ToolbarItems
} from './toolbar';

import {
  CalendarPanel
} from './panel';

/**
 * A widget factory for Calendar panels.
 */
export
class CalendarFactory extends ABCWidgetFactory<CalendarPanel, ICalendarModel> {
  /**
   * Construct a new Calendar widget factory.
   *
   * @param options - The options used to construct the factory.
   */
  constructor(options: CalendarFactory.IOptions) {
    super(options);
    this.contentFactory = options.contentFactory;
  }

  /**
   * The content factory used by the widget factory.
   */
  readonly contentFactory: CalendarPanel.IContentFactory;

  /**
   * Create a new widget.
   *
   * #### Notes
   * The factory will start the appropriate kernel and populate
   * the default toolbar items using `ToolbarItems.populateDefaults`.
   */
  protected createNewWidget(context: DocumentRegistry.IContext<ICalendarModel>): CalendarPanel {
    let panel = new CalendarPanel({
      contentFactory: this.contentFactory
    });
    panel.context = context;
    ToolbarItems.populateDefaults(panel);
    return panel;
  }
}

/**
 * The namespace for `CalendarFactory` statics.
 */
export
namespace CalendarFactory {
  /**
   * The options used to construct a `CalendarFactory`.
   */
  export
  interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {

    /**
     * A Calendar panel content factory.
     */
    contentFactory: CalendarPanel.IContentFactory;

  }
}
