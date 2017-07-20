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

import 'fullcalendar-scheduler/dist/scheduler.js';

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
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
  			editable: true,
        //droppable: true,
  			aspectRatio: 1.9,
  			//scrollTime: '00:00',
        /*
        eventLimit: true,
        googleCalendarApiKey: 'AIzaSyDjh1p472rNVktbzltiO6NM7DRRNccx-t4',
        events: {
          googleCalendarId: '41g8dii7l1mk3fqsr74ifl8o8s@group.calendar.google.com',
          className: 'gcal-event'
        },
        */
        header:{
              left: 'addTask today prev,next',
              center: 'title',
              right: 'timelineDay,agendaWeek,month'
        },
        customButtons: {
  				addTask: {
  					text: '+ task',
  					click: function() {
							calendar.fullCalendar(
								'addResource',
								{ title: 'new task' },
								true // scroll to the new resource?
							);
  					}
  				}
  			},
        defaultView: 'timelineDay',
        resourceAreaWidth: '30%',
        resourceColumns: [
          {
            labelText: 'Task',
            field: 'title'
          },
          {
            labelText: 'Priority',
            field: 'priority'
          }
        ],
        resources: [
          { id: 'a', title: 'Task A', priority: 40 },
          { id: 'b', title: 'Task B', priority: 40, eventColor: 'green' },
          { id: 'c', title: 'Task C', priority: 40, eventColor: 'orange' },
          { id: 'd', title: 'Task D', priority: 40, children: [
            { id: 'd1', title: 'Task D1', priority: 10 },
            { id: 'd2', title: 'Task D2', priority: 10 }
          ] },
          { id: 'e', title: 'Task E', priority: 40 },
          { id: 'f', title: 'Task F', priority: 40, eventColor: 'red' },
          { id: 'g', title: 'Task G', priority: 40 },
          { id: 'h', title: 'Task H', priority: 40 },
          { id: 'i', title: 'Task I', priority: 40 },
          { id: 'j', title: 'Task J', priority: 40 },
          { id: 'k', title: 'Task K', priority: 40 },
          { id: 'l', title: 'Task L', priority: 40 },
          { id: 'm', title: 'Task M', priority: 40 },
          { id: 'n', title: 'Task N', priority: 40 },
          { id: 'o', title: 'Task O', priority: 40 },
          { id: 'p', title: 'Task P', priority: 40 },
          { id: 'q', title: 'Task Q', priority: 40 },
          { id: 'r', title: 'Task R', priority: 40 },
          { id: 's', title: 'Task S', priority: 40 },
          { id: 't', title: 'Task T', priority: 40 },
          { id: 'u', title: 'Task U', priority: 40 },
          { id: 'v', title: 'Task V', priority: 40 },
          { id: 'w', title: 'Task W', priority: 40 },
          { id: 'x', title: 'Task X', priority: 40 },
          { id: 'y', title: 'Task Y', priority: 40 },
          { id: 'z', title: 'Task Z', priority: 40 }
        ],
        events: [
          { id: '1', resourceId: 'b', start: '2017-05-07T02:00:00', end: '2017-05-07T07:00:00', title: 'event 1' },
          { id: '2', resourceId: 'c', start: '2017-05-07T05:00:00', end: '2017-05-07T22:00:00', title: 'event 2' },
          { id: '3', resourceId: 'd', start: '2017-05-06', end: '2017-05-08', title: 'event 3' },
          { id: '4', resourceId: 'e', start: '2017-05-07T03:00:00', end: '2017-05-07T08:00:00', title: 'event 4' },
          { id: '5', resourceId: 'f', start: '2017-05-07T00:30:00', end: '2017-05-07T02:30:00', title: 'event 5' }
        ]

      });

      return widget;

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
      category: 'Quantitative Finance',
      rank: 1,
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
