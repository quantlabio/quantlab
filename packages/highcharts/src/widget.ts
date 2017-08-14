// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  PathExt
} from '@quantlab/coreutils';

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  ActivityMonitor
} from '@quantlab/coreutils';

import {
  ABCWidgetFactory, DocumentRegistry
} from '@quantlab/docregistry';

import * as Highcharts from 'highcharts';

import * as Highstock from 'highcharts/highstock';

const HIGHCHARTS_CLASS = 'jp-HighCharts';

//const DIRTY_CLASS = 'jp-mod-dirty';

const RENDER_TIMEOUT = 1000;

export
class HighCharts extends Widget implements DocumentRegistry.IReadyWidget {

  constructor(options: HighCharts.IOptions) {
    super();

    const context = this._context = options.context;

    this.addClass(HIGHCHARTS_CLASS);

    context.pathChanged.connect(this._onPathChanged, this);
    context.ready.then(() => { this._onContextReady(); });
    this._onPathChanged();
  }

  get context(): DocumentRegistry.Context {
    return this._context;
  }

  get ready() {
    return this._ready.promise;
  }

  private _onContextReady(): void {
    if (this.isDisposed) {
      return;
    }
    const contextModel = this._context.model;

    // Resolve the ready promise.
    this._ready.resolve(undefined);

    this._updateHighCharts();

    // Throttle the rendering rate of the widget.
    this._monitor = new ActivityMonitor({
      signal: contextModel.contentChanged,
      timeout: RENDER_TIMEOUT
    });
    this._monitor.activityStopped.connect(this._updateHighCharts, this);
  }

  dispose(): void {
    let monitor = this._monitor;
    this._monitor = null;
    if (monitor) {
      monitor.dispose();
    }
    this._chart.destroy();
    super.dispose();
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this.node.tabIndex = -1;
    this.node.focus();
  }

  /**
   * Handle a change in path.
   */
  private _onPathChanged(): void {
    const path = this._context.path;
    this.title.label = PathExt.basename(path.split(':').pop()!);
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this._chart.setSize(msg.width, msg.height, false);
  }

  private _updateHighCharts(): void {
    let contextModel = this._context.model;
    let content = JSON.parse(contextModel.toString());
    content.credits = {
      enabled: false
    };
    content.reflow = false;

    const path = this._context.path;
    let ext = PathExt.basename(path.split(':').pop()!);
    ext = ext.split('.').pop();

    if(ext == 'hc')
      this._chart = Highcharts.chart(this.id, content);
    else if(ext == 'hs')
      this._chart = new Highstock.StockChart(this.id, content);

  }

  private _context: DocumentRegistry.Context = null;
  private _ready = new PromiseDelegate<void>();
  private _monitor: ActivityMonitor<any, any> = null;
  private _chart: any = null;
}

export
namespace HighCharts {

  export
  interface IOptions {

    context: DocumentRegistry.Context;

  }

}

export
class HighChartsFactory extends ABCWidgetFactory<HighCharts, DocumentRegistry.IModel> {
  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.Context): HighCharts {
    return new HighCharts({ context });
  }
}
