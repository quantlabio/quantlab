// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ABCWidgetFactory, DocumentRegistry
} from '@quantlab/docregistry';

import {
  IHighChartsModel
} from './model';

import {
  ToolbarItems
} from './toolbar';

import {
  HighChartsPanel
} from './panel';

import * as Highcharts from 'highcharts';
import Highmore = require('highcharts/highcharts-more');
import High3D = require('highcharts/highcharts-3d');
import HighDrag3D = require('highcharts/modules/draggable-3d');
import HighGauge = require('highcharts/modules/solid-gauge');


/**
 * A widget factory for HighCharts panels.
 */
export
class HighChartsFactory extends ABCWidgetFactory<HighChartsPanel, IHighChartsModel> {
  /**
   * Construct a new HighCharts widget factory.
   *
   * @param options - The options used to construct the factory.
   */
  constructor(options: HighChartsFactory.IOptions) {
    super(options);
    this.contentFactory = options.contentFactory;

    Highmore(Highcharts);
    High3D(Highcharts);
    HighDrag3D(Highcharts);
    HighGauge(Highcharts);
    //HighData(Highcharts);
    //HighExport(Highcharts);
  }

  /**
   * The content factory used by the widget factory.
   */
  readonly contentFactory: HighChartsPanel.IContentFactory;

  /**
   * Create a new widget.
   *
   * #### Notes
   * The factory will start the appropriate kernel and populate
   * the default toolbar items using `ToolbarItems.populateDefaults`.
   */
  protected createNewWidget(context: DocumentRegistry.IContext<IHighChartsModel>): HighChartsPanel {
    let panel = new HighChartsPanel({
      contentFactory: this.contentFactory
    });
    panel.context = context;
    ToolbarItems.populateDefaults(panel);
    return panel;
  }
}

/**
 * The namespace for `HighChartsFactory` statics.
 */
export
namespace HighChartsFactory {
  /**
   * The options used to construct a `HighChartsFactory`.
   */
  export
  interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {

    /**
     * A HighCharts panel content factory.
     */
    contentFactory: HighChartsPanel.IContentFactory;

  }
}
