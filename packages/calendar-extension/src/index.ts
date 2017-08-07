// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IServiceManager
} from '@quantlab/services';

import {
  ILayoutRestorer, QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  InstanceTracker, ICommandPalette, IMainMenu
} from '@quantlab/apputils';

import {
  ILauncher
} from '@quantlab/launcher';

import {
  Menu
} from '@phosphor/widgets';

import {
  Calendar, CalendarFactory
} from '@quantlab/calendar';

import * as $
  from 'jquery';

import '@quantlab/fullcalendar';

import '@quantlab/fullcalendar/dist/gcal.js';

import '@quantlab/fullcalendar-scheduler/dist/scheduler.js';

/**
 * The command IDs used by the calendar plugin.
 */
namespace CommandIDs {
  export
  const open = 'calendar:open';

  export
  const save = 'calendar:save';
};

/**
 * The name of the factory that creates Calendar widgets.
 */
const FACTORY = 'Calendar';

/**
 * The class name for the calendar icon in the default theme.
 */
const CALENDAR_ICON_CLASS = 'jp-CalendarIcon';

/**
 * The default calendar extension.
 */
const plugin: QuantLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.calendar',
  requires: [
    ILayoutRestorer, IServiceManager, IMainMenu, ICommandPalette
  ],
  optional: [ILauncher],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;


/**
 * Activate the calendar plugin.
 */
function activate(app: QuantLab, restorer: ILayoutRestorer, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): void {
  const factory = new CalendarFactory({
    name: FACTORY,
    fileTypes: ['ics'],
    defaultFor: ['ics']
  });
  const tracker = new InstanceTracker<Calendar>({ namespace: 'calendar' });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  app.docRegistry.addWidgetFactory(factory);
  let ft = app.docRegistry.getFileType('ics');
  factory.widgetCreated.connect((sender, widget) => {
    // Track the widget.
    tracker.add(widget);
    // Notify the instance tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => { tracker.save(widget); });

    if (ft) {
      widget.title.iconClass = ft.iconClass;
      widget.title.iconLabel = ft.iconLabel;
    }
  });

  const { commands, shell } = app;
  const category = 'Calendar';

  commands.addCommand(CommandIDs.save, {
    label: 'Save',
    execute: () => {
      //let context = docManager.contextForWidget(app.shell.currentWidget);
      //return context.save();
    }
  });

  commands.addCommand(CommandIDs.open, {
    label: 'Open',
    execute: args => {
      let id = `jp-Calendar-${Private.id++}`;

      let widget = new Calendar({context:null});
      widget.id = id;
      widget.title.label = 'Calendar';
      widget.title.icon = 'CALENDAR_ICON_CLASS';
      widget.title.closable = true;

      shell.addToMainArea(widget);
      shell.activateById(widget.id);

      let calendar:JQuery = $('#' + id);
      calendar.fullCalendar({
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
  			//aspectRatio: 2.0,
        eventLimit: true,
        googleCalendarApiKey: 'AIzaSyDjh1p472rNVktbzltiO6NM7DRRNccx-t4',
        events: {
          googleCalendarId: '41g8dii7l1mk3fqsr74ifl8o8s@group.calendar.google.com'//,
          //className: 'gcal-event'
        },
        header:{
              left: 'today prev,next',
              center: 'title',
              right: 'month,agendaWeek,agendaDay'
        },
        defaultView: 'agendaWeek'
      });

      return widget;

    }
  });

  // Add command palette and menu items.
  let menu = new Menu({ commands });
  menu.title.label = category;
  [
    CommandIDs.open,
    CommandIDs.save
  ].forEach(command => {
    palette.addItem({ command, category });
    menu.addItem({ command });
  });
  mainMenu.addMenu(menu, {rank: 60});

  // Add a launcher item if the launcher is available.
  if (launcher) {
    launcher.add({
      displayName: 'Calendar',
      category: 'Other',
      rank: 1,
      iconClass: CALENDAR_ICON_CLASS,
      callback: () => {
        return commands.execute(CommandIDs.open);
      }
    });
  }


}

/**
 * A namespace for private data.
 */
namespace Private {

  /**
   * An incrementing counter for ids.
   */
  export
  let id = 0;
}
