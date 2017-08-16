// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IInstanceTracker, InstanceTracker
} from '@quantlab/apputils';

import {
  Token
} from '@phosphor/coreutils';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  HighCharts
} from './';


/**
 * An object that tracks chart widgets.
 */
export
interface IChartTracker extends IInstanceTracker<HighCharts> {

  /**
   * A signal emitted when the selection state changes.
   */
  readonly selectionChanged: ISignal<this, void>;
}


/* tslint:disable */
/**
 * The chart tracker token.
 */
export
const IChartTracker = new Token<IChartTracker>('jupyter.services.highcharts');
/* tslint:enable */


export
class ChartTracker extends InstanceTracker<HighCharts> implements IChartTracker {

  /**
   * A signal emitted when the selection state changes.
   */
  get selectionChanged(): ISignal<this, void> {
    return this._selectionChanged;
  }

  /**
   * Add a new chart panel to the tracker.
   *
   * @param panel - The chart panel being added.
   */
  add(chart: HighCharts): Promise<void> {
    const promise = super.add(chart);

    return promise;
  }

  /**
   * Dispose of the resources held by the tracker.
   */
  dispose(): void {

    super.dispose();
  }

  private _selectionChanged = new Signal<this, void>(this);

}
