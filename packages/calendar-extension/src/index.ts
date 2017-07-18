// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IServiceManager
} from '@quantlab/services';

import {
  QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  ICommandPalette, IMainMenu
} from '@quantlab/apputils';

import {
  ILauncher
} from '@quantlab/launcher';

import {
  Menu
} from '@phosphor/widgets';

import {
  Calendar
} from '@quantlab/calendar';

import * as $
  from 'jquery';

import 'fullcalendar';

import 'fullcalendar/dist/gcal.js';

/**
 * The command IDs used by the calendar plugin.
 */
namespace CommandIDs {
  export
  const create = 'calendar:create';
};

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
    IServiceManager, IMainMenu, ICommandPalette
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
function activate(app: QuantLab, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): void {
  const { commands, shell } = app;
  const category = 'Calendar';

  commands.addCommand(CommandIDs.create, {
    label: 'New Calendar',
    execute: args => {
      let id = `jp-Calendar-${Private.id++}`;
      let widget = new Calendar();
      widget.id = id;
      widget.title.label = 'Calendar';
      widget.title.icon = 'CALENDAR_ICON_CLASS';
      widget.title.closable = true;

      shell.addToMainArea(widget);
      shell.activateById(widget.id);
      
      let calendar:JQuery = $('#' + id);
      calendar.fullCalendar({
        eventLimit: true,
        googleCalendarApiKey: 'AIzaSyDjh1p472rNVktbzltiO6NM7DRRNccx-t4',
        events: {
          googleCalendarId: '41g8dii7l1mk3fqsr74ifl8o8s@group.calendar.google.com',
          className: 'gcal-event'
        },
        header:{
              left: 'today prev,next',
              center: 'title',
              right: 'month,agendaWeek,agendaDay'
        },
        defaultView: 'agendaWeek'
      });

    }
  });

  // Add command palette and menu items.
  let menu = new Menu({ commands });
  menu.title.label = category;
  [
    CommandIDs.create
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
      rank: 0,
      iconClass: CALENDAR_ICON_CLASS,
      callback: () => {
        return commands.execute(CommandIDs.create);
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
