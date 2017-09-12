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
  CalendarPanel
} from './panel';


/**
 * An object that tracks Calendar widgets.
 */
export
interface ICalendarTracker extends IInstanceTracker<CalendarPanel> {

  /**
   * A signal emitted when the selection state changes.
   */
  readonly selectionChanged: ISignal<this, void>;
}


/* tslint:disable */
/**
 * The Calendar tracker token.
 */
export
const ICalendarTracker = new Token<ICalendarTracker>('jupyter.services.calendars');
/* tslint:enable */


export
class CalendarTracker extends InstanceTracker<CalendarPanel> implements ICalendarTracker {


  /**
   * A signal emitted when the selection state changes.
   */
  get selectionChanged(): ISignal<this, void> {
    return this._selectionChanged;
  }

  /**
   * Add a new Calendar panel to the tracker.
   *
   * @param panel - The Calendar panel being added.
   */
  add(panel: CalendarPanel): Promise<void> {
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
