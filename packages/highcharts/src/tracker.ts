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
  HighChartsPanel
} from './panel';


/**
 * An object that tracks HighCharts widgets.
 */
export
interface IHighChartsTracker extends IInstanceTracker<HighChartsPanel> {

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
const IHighChartsTracker = new Token<IHighChartsTracker>('jupyter.services.highcharts');
/* tslint:enable */


export
class HighChartsTracker extends InstanceTracker<HighChartsPanel> implements IHighChartsTracker {

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
  add(panel: HighChartsPanel): Promise<void> {
    const promise = super.add(panel);

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
