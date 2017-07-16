// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  CalendarSession
} from '@quantlab/services';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import * as $
  from 'jquery';

import 'fullcalendar';

/**
 * The class name added to a calendar widget.
 */
const CALENDAR_CLASS = 'jp-Calendar';

/**
 * The class name added to a calendar body.
 */
//const CALENDAR_BODY_CLASS = 'jp-Calendar-body';

/**
 * The class name add to the calendar widget when it has the dark theme.
 */
const CALENDAR_DARK_THEME = 'jp-Calendar-dark';

/**
 * The class name add to the calendar widget when it has the light theme.
 */
const CALENDAR_LIGHT_THEME = 'jp-Calendar-light';


/**
 * The number of rows to use in the dummy calendar.
 */
const DUMMY_ROWS = 24;

/**
 * The number of cols to use in the dummy calendar.
 */
const DUMMY_COLS = 80;


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
  constructor(options: Calendar.IOptions = {}) {
    super();
    this.addClass(CALENDAR_CLASS);

    // Create the fullcalendar, dummy calendar, and private style sheet.
    this._calendar = $(`#jp-Calendar-${Private.id++}`);
    this._initializeCalendar();
    this._dummyCalendar = Private.createDummyCalendar();

    // Initialize settings.
    let defaults = Calendar.defaultOptions;
    this._fontSize = options.fontSize || defaults.fontSize;
    this.theme = options.theme || defaults.theme;
    this.id = `jp-Calendar-${Private.id++}`;
    this.title.label = 'Calendar';
  }

  /**
   * The calendar session associated with the widget.
   */
  get session(): CalendarSession.ISession {
    return this._session;
  }
  set session(value: CalendarSession.ISession) {
    if (this._session && !this._session.isDisposed) {
      this._session.messageReceived.disconnect(this._onMessage, this);
    }
    this._session = value || null;
    if (!value) {
      return;
    }
    this._session.ready.then(() => {
      if (this.isDisposed) {
        return;
      }
      this._session.messageReceived.connect(this._onMessage, this);
      this.title.label = `Calendar ${this._session.name}`;
      this._setSessionSize();
    });
  }

  /**
   * Get the font size of the calendar in pixels.
   */
  get fontSize(): number {
    return this._fontSize;
  }

  /**
   * Set the font size of the calendar in pixels.
   */
  set fontSize(size: number) {
    if (this._fontSize === size) {
      return;
    }
    this._fontSize = size;
    this._needsSnap = true;
    this.update();
  }

  /**
   * Get the current theme, either light or dark.
   */
  get theme(): Calendar.Theme {
    return this._theme;
  }

  /**
   * Set the current theme, either light or dark.
   */
  set theme(value: Calendar.Theme) {
    this._theme = value;
    this.toggleClass(CALENDAR_LIGHT_THEME, value === 'light');
    this.toggleClass(CALENDAR_DARK_THEME, value === 'dark');
  }

  /**
   * Dispose of the resources held by the calendar widget.
   */
  dispose(): void {
    this._session = null;
    this._calendar = null;
    this._dummyCalendar = null;
    this._box = null;
    super.dispose();
  }

  /**
   * Refresh the calendar session.
   */
  refresh(): Promise<void> {
    if (!this._session) {
      return Promise.reject(void 0);
    }
    return this._session.reconnect().then(() => {
      //TODO: this._calendar.clear();
    });
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   *
   * #### Notes
   * Subclasses may reimplement this method as needed.
   */
  processMessage(msg: Message): void {
    super.processMessage(msg);
    switch (msg.type) {
      case 'fit-request':
        this.onFitRequest(msg);
        break;
      default:
        break;
    }
  }

  /**
   * Set the size of the calendar when attached if dirty.
   */
  protected onAfterAttach(msg: Message): void {
    this.update();
  }

  /**
   * Set the size of the calendar when shown if dirty.
   */
  protected onAfterShow(msg: Message): void {
    this.update();
  }

  /**
   * Dispose of the calendar when closing.
   */
  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.dispose();
  }

  /**
   * On resize, use the computed row and column sizes to resize the calendar.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    this._offsetWidth = msg.width;
    this._offsetHeight = msg.height;
    this._needsResize = true;
    this.update();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (!this.isVisible) {
      return;
    }
    if (this._needsSnap) {
      this._snapCalendarSizing();
    }
    if (this._needsResize) {
      this._resizeCalendar();
    }
  }

  /**
   * A message handler invoked on an `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    let resize = Widget.ResizeMessage.UnknownSize;
    MessageLoop.sendMessage(this, resize);
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this._calendar.focus();
  }

  /**
   * Create the calendar object.
   */
  private _initializeCalendar(): void {
    this._calendar.fullCalendar({});
    //this._calendar.open(this.node, false);
    //this._calendar.element.classList.add(CALENDAR_BODY_CLASS);

    //this._calendar.on('data', (data: string) => {
    //  if (this._session) {
    //    this._session.send({
    //      type: 'stdin',
    //      content: [data]
    //    });
    //  }
    //});

    //this._calendar.on('title', (title: string) => {
    //    this.title.label = title;
    //});
  }

  /**
   * Handle a message from the calendar session.
   */
  private _onMessage(sender: CalendarSession.ISession, msg: CalendarSession.IMessage): void {
    switch (msg.type) {
    case 'stdout':
      //this._calendar.write(msg.content[0] as string);
      break;
    case 'disconnect':
      //this._calendar.write('\r\n\r\n[Finished... Term Session]\r\n');
      break;
    default:
      break;
    }
  }

  /**
   * Use the dummy calendar to measure the row and column sizes.
   */
  private _snapCalendarSizing(): void {
    //this._calendar.element.style.fontSize = `${this.fontSize}px`;
    let node = this._dummyCalendar;
    //this._calendar.element.appendChild(node);
    this._rowHeight = node.offsetHeight / DUMMY_ROWS;
    this._colWidth = node.offsetWidth / DUMMY_COLS;
    //this._calendar.element.removeChild(node);
    this._needsSnap = false;
    this._needsResize = true;
  }

  /**
   * Resize the calendar based on computed geometry.
   */
  private _resizeCalendar() {
    let offsetWidth = this._offsetWidth;
    let offsetHeight = this._offsetHeight;
    if (offsetWidth < 0) {
      offsetWidth = this.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.node.offsetHeight;
    }
    let box = this._box || (this._box = ElementExt.boxSizing(this.node));
    let height = offsetHeight - box.verticalSum;
    let width = offsetWidth - box.horizontalSum;
    let rows = Math.floor(height / this._rowHeight) - 1;
    let cols = Math.floor(width / this._colWidth) - 1;
    //this._calendar.resize(cols, rows);
    this._sessionSize = [rows, cols, height, width];
    this._setSessionSize();
    this._needsResize = false;
  }

  /**
   * Send the size to the session.
   */
  private _setSessionSize(): void {
    if (this._session) {
      this._session.send({
        type: 'set_size',
        content: this._sessionSize
      });
    }
  }

  private _calendar: JQuery = null;
  private _dummyCalendar: HTMLElement = null;
  private _fontSize = -1;
  private _needsSnap = true;
  private _needsResize = true;
  private _rowHeight = -1;
  private _colWidth = -1;
  private _offsetWidth = -1;
  private _offsetHeight = -1;
  private _sessionSize: [number, number, number, number] = [1, 1, 1, 1];
  private _theme: Calendar.Theme = 'dark';
  private _box: ElementExt.IBoxSizing = null;
  private _session: CalendarSession.ISession = null;
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
     * The font size of the calendar in pixels.
     */
    fontSize?: number;

    /**
     * The theme of the calendar.
     */
    theme?: Theme

    /**
     * Whether to blink the cursor.  Can only be set at startup.
     */
    cursorBlink?: boolean;
  }

  /**
   * The default options used for creating calendars.
   */
  export
  const defaultOptions: IOptions = {
    theme: 'dark',
    fontSize: 13,
    cursorBlink: true
  };

  /**
   * A type for the calendar theme.
   */
  export
  type Theme = 'light' | 'dark';
}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * Get fullcalendar.js options from ICalendarOptions.
   */
  export
  function getConfig(options: Calendar.IOptions): Calendar.IOptions {
    let config: Calendar.IOptions = {};
    if (options.cursorBlink !== void 0) {
      config.cursorBlink = options.cursorBlink;
    } else {
      config.cursorBlink = Calendar.defaultOptions.cursorBlink;
    }
    return config;
  }

  /**
   * Create a dummy calendar element used to measure text size.
   */
  export
  function createDummyCalendar(): HTMLElement {
    let node = document.createElement('div');
    let rowspan = document.createElement('span');
    rowspan.innerHTML = Array(DUMMY_ROWS).join('a<br>');
    let colspan = document.createElement('span');
    colspan.textContent = Array(DUMMY_COLS + 1).join('a');
    node.appendChild(rowspan);
    node.appendChild(colspan);
    node.style.visibility = 'hidden';
    node.style.position = 'absolute';
    node.style.height = 'auto';
    node.style.width = 'auto';
    (node.style as any)['white-space'] = 'nowrap';
    return node;
  }

  /**
   * An incrementing counter for ids.
   */
  export
  let id = 0;
}
