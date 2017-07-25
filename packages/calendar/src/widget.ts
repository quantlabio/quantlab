// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  PromiseDelegate
} from '@phosphor/coreutils';

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

import * as $
  from 'jquery';

import 'fullcalendar';

import 'fullcalendar/dist/gcal.js';

import 'fullcalendar-scheduler/dist/scheduler.js';

/**
 * The class name added to a calendar widget.
 */
const CALENDAR_CLASS = 'jp-Calendar';

/**
 * The timeout to wait for change activity to have ceased before rendering.
 */
const RENDER_TIMEOUT = 1000;

/**
 * A widget which manages a calendar session.
 */
export
class Calendar extends Widget implements DocumentRegistry.IReadyWidget {
  /**
   * Construct a new calendar widget.
   *
   * @param options - The calendar configuration options.
   */
  constructor(options: Calendar.IOptions) {
    super();

    this.addClass(CALENDAR_CLASS);

    let context = this._context = options.context;

    if(context){
      this.title.label = context.path.split('/').pop();
      context.pathChanged.connect(this._onPathChanged, this);

      this._context.ready.then(() => {
        this._updateCalendar();
        this._ready.resolve(undefined);
        // Throttle the rendering rate of the widget.
        this._monitor = new ActivityMonitor({
          signal: context.model.contentChanged,
          timeout: RENDER_TIMEOUT
        });
        this._monitor.activityStopped.connect(this._updateCalendar, this);
      });
    }else{
      this.title.label = 'Calendar';
    }

  }

  /**
   * The Calendar widget's context.
   */
  get context(): DocumentRegistry.Context {
    return this._context;
  }

  /**
   * A promise that resolves when the calendar is ready.
   */
  get ready() {
    return this._ready.promise;
  }

  /**
   * Dispose of the resources held by the calendar widget.
   */
  dispose(): void {
    let monitor = this._monitor;
    this._monitor = null;
    if (monitor) {
      monitor.dispose();
    }
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
    this.title.label = this._context.path.split('/').pop();
  }

  /**
   * Create the json model for the calendar.
   */
  private _updateCalendar(): void {
    let content = this._context.model.toString();
    this._calendar = $('#' + this.id);
    this._calendar.fullCalendar({
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
      editable: true,
      //droppable: true,
      aspectRatio: 2.0,
      //scrollTime: '00:00',
      eventLimit: true,
      header:{
            left: 'today prev,next',
            center: 'title',
            right: 'timelineDay,agendaWeek,month'
      },
      defaultView: 'timelineDay',
      resourceAreaWidth: '20%',
      resourceColumns: JSON.parse(content).resourceColumns,
      resources: JSON.parse(content).resources,
      events: JSON.parse(content).events
    });
  }

  private _context: DocumentRegistry.Context = null;
  private _ready = new PromiseDelegate<void>();
  private _monitor: ActivityMonitor<any, any> = null;
  private _calendar: JQuery = null;
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
    /**
     * The document context for the Calendar being rendered by the widget.
     */
    context: DocumentRegistry.Context;
  }
}

/**
 * A widget factory for Calendar widgets.
 */
export
class CalendarFactory extends ABCWidgetFactory<Calendar, DocumentRegistry.IModel> {
  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.Context): Calendar {
    return new Calendar({ context });
  }
}
