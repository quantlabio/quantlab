// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  ICalendarModel
} from './model';

import * as $
  from 'jquery';

import '@quantlab/fullcalendar';

import '@quantlab/fullcalendar/dist/gcal.js';

import '@quantlab/fullcalendar-scheduler/dist/scheduler.js';


/**
 * The class name added to a calendar widget.
 */
//const CALENDAR_CLASS = 'jp-Calendar';


/**
 * A widget which manages a calendar session.
 */
export
class Calendar extends Widget {
  /**
   * Construct a new calendar widget.
   *
   * @param options - The calendar configuration options.
   */
  constructor(options: Calendar.IOptions) {
    super();

  }

  /**
   * A signal emitted when the model of the notebook changes.
   */
  get modelChanged(): ISignal<this, void> {
    return this._modelChanged;
  }

  /**
   * A signal emitted when the model content changes.
   *
   * #### Notes
   * This is a convenience signal that follows the current model.
   */
  get modelContentChanged(): ISignal<this, void> {
    return this._modelContentChanged;
  }

  /**
   * The cell factory used by the widget.
   */
  readonly contentFactory: Calendar.IContentFactory;

  /**
   * The model for the widget.
   */
  get model(): ICalendarModel {
    return this._model;
  }
  set model(newValue: ICalendarModel) {
    newValue = newValue || null;
    if (this._model === newValue) {
      return;
    }
    let oldValue = this._model;
    this._model = newValue;

    if (oldValue && oldValue.modelDB.isCollaborative) {
      oldValue.modelDB.connected.then(() => {
        oldValue.modelDB.collaborators.changed.disconnect(
          this._onCollaboratorsChanged, this);
      });
    }
    if (newValue && newValue.modelDB.isCollaborative) {
      newValue.modelDB.connected.then(() => {
        newValue.modelDB.collaborators.changed.connect(
          this._onCollaboratorsChanged, this);
      });
    }

    // Trigger private, protected, and public changes.
    this._onModelChanged(oldValue, newValue);
    this.onModelChanged(oldValue, newValue);
    this._modelChanged.emit(void 0);
  }

  /**
   * Handle a new model.
   *
   * #### Notes
   * This method is called after the model change has been handled
   * internally and before the `modelChanged` signal is emitted.
   * The default implementation is a no-op.
   */
  protected onModelChanged(oldValue: ICalendarModel, newValue: ICalendarModel): void {
    // No-op.
  }

  /**
   * Handle changes to the notebook model content.
   *
   * #### Notes
   * The default implementation emits the `modelContentChanged` signal.
   */
  protected onModelContentChanged(model: ICalendarModel, args: void): void {
    this._modelContentChanged.emit(void 0);
  }

  /**
   * Handle a new model on the widget.
   */
  private _onModelChanged(oldValue: ICalendarModel, newValue: ICalendarModel): void {
    if (oldValue) {
      oldValue.contentChanged.disconnect(this.onModelContentChanged, this);
    }

    newValue.contentChanged.connect(this.onModelContentChanged, this);
  }

  /**
   * get calendar model
   */
  modelJSON(): any{

    return null;
  }

  /**
   * Dispose of the resources held by the calendar widget.
   */
  dispose(): void {
    // Do nothing if already disposed.
    if (this.isDisposed) {
      return;
    }
    this._model = null;
    //this._calendar.destroy();
    super.dispose();
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this.node.tabIndex = -1;
    this.node.focus();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    if(this._calendar != null)
      this._calendar.fullCalendar('option', 'aspectRatio', msg.width/(msg.height - 66));
  }

  /**
   * Create the json model for the calendar.
   */
  createCalendar(): void {
    let contextModel = this._model;
    let content:any = {};

    if(contextModel.toString() == ''){
      content.resourceColumns = [];
      content.resources = [];
      content.events = [];
    } else {
      content = JSON.parse(contextModel.toString());
    }

    this._calendar = $('#' + this.parent.id).children().eq(1);
    this._calendar.fullCalendar({
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
      editable: true,
      //droppable: true,
      aspectRatio: this._calendar.width()/(this._calendar.height()-66),
      //scrollTime: '00:00',
      eventLimit: true,
      header:{
            left: 'today prev,next',
            center: 'title',
            right: 'timelineDay,timelineWeek,timelineMonth'
      },
      defaultView: 'timelineWeek',
      resourceAreaWidth: '20%',
      resourceColumns: content.resourceColumns,
      resources: content.resources,
      events: content.events
    });
  }

  /**
   * Handle an update to the collaborators.
   */
  private _onCollaboratorsChanged(): void {

  }

  private _model: ICalendarModel = null;
  private _calendar: JQuery = null;
  private _modelChanged = new Signal<this, void>(this);
  private _modelContentChanged = new Signal<this, void>(this);
}

/**
 * The namespace for `Calendar` class statics.
 */
export
namespace Calendar {
  /**
   * Options for the calendar widget.
   */
  export
  interface IOptions {

  }

  /**
   * A factory for creating calendar content.
   *
   */
  export
  interface IContentFactory {

  }

}
