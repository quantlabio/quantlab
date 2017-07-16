// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILayoutRestorer, QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  ICommandPalette, IMainMenu, InstanceTracker
} from '@quantlab/apputils';

import {
  ILauncher
} from '@quantlab/launcher';

import {
  IServiceManager
} from '@quantlab/services';

import {
  Calendar, ICalendarTracker
} from '@quantlab/calendar';

import {
  Menu
} from '@phosphor/widgets';


/**
 * The command IDs used by the calendar plugin.
 */
namespace CommandIDs {
  export
  const createNew = 'calendar:create-new';

  export
  const open = 'calendar:open';

  export
  const refresh = 'calendar:refresh';

  export
  const increaseFont = 'calendar:increase-font';

  export
  const decreaseFont = 'calendar:decrease-font';

  export
  const toggleTheme = 'calendar:toggle-theme';
};



/**
 * The class name for the calendar icon in the default theme.
 */
const CALENDAR_ICON_CLASS = 'jp-CalendarIcon';


/**
 * The default calendar extension.
 */
const plugin: QuantLabPlugin<ICalendarTracker> = {
  activate,
  id: 'jupyter.extensions.calendar',
  provides: ICalendarTracker,
  requires: [
    IServiceManager, IMainMenu, ICommandPalette, ILayoutRestorer
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
function activate(app: QuantLab, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, restorer: ILayoutRestorer, launcher: ILauncher | null): ICalendarTracker {
  // Bail if there are no calendars available.
  //if (!services.calendars.isAvailable()) {
  //  console.log('Disabling calendars plugin because they are not available on the server');
  //  return;
  //}

  const { commands } = app;
  const category = 'Calendar';
  const namespace = 'calendar';
  const tracker = new InstanceTracker<Calendar>({ namespace });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: CommandIDs.createNew,
    args: widget => ({ name: widget.session.name }),
    name: widget => widget.session && widget.session.name
  });

  // Update the command registry when the calendar state changes.
  tracker.currentChanged.connect(() => {
    if (tracker.size <= 1) {
      commands.notifyCommandChanged(CommandIDs.refresh);
    }
  });

  addCommands(app, services, tracker);

  // Add command palette and menu items.
  let menu = new Menu({ commands });
  menu.title.label = category;
  [
    CommandIDs.createNew,
    CommandIDs.refresh,
    CommandIDs.increaseFont,
    CommandIDs.decreaseFont,
    CommandIDs.toggleTheme
  ].forEach(command => {
    palette.addItem({ command, category });
    if (command !== CommandIDs.createNew) {
      menu.addItem({ command });
    }
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
        return commands.execute(CommandIDs.createNew);
      }
    });
  }

  app.contextMenu.addItem({command: CommandIDs.refresh, selector: '.jp-Calendar', rank: 1});

  return tracker;
}


/**
 * Add the commands for the calendar.
 */
export
function addCommands(app: QuantLab, services: IServiceManager, tracker: InstanceTracker<Calendar>) {
  let { commands, shell } = app;

  /**
   * Whether there is an active calendar.
   */
  function hasWidget(): boolean {
    return tracker.currentWidget !== null;
  }

  // Add calendar commands.
  commands.addCommand(CommandIDs.createNew, {
    label: 'New Calendar',
    caption: 'Start a new calendar session',
    execute: args => {
      let name = args ? args['name'] as string : '';
      let term = new Calendar();
      term.title.closable = true;
      term.title.icon = CALENDAR_ICON_CLASS;
      term.title.label = '...';
      shell.addToMainArea(term);

      let promise = name ?
        services.calendars.connectTo(name)
        : services.calendars.startNew();

      return promise.then(session => {
        term.session = session;
        tracker.add(term);
        shell.activateById(term.id);
        return term;
      }).catch(() => { term.dispose(); });
    }
  });

  commands.addCommand(CommandIDs.open, {
    execute: args => {
      const name = args['name'] as string;
      // Check for a running calendar with the given name.
      const widget = tracker.find(value => value.session.name === name);
      if (widget) {
        shell.activateById(widget.id);
      } else {
        // Otherwise, create a new calendar with a given name.
        return commands.execute(CommandIDs.createNew, { name });
      }
    }
  });

  commands.addCommand(CommandIDs.refresh, {
    label: 'Refresh Calendar',
    caption: 'Refresh the current calendar session',
    execute: () => {
      let current = tracker.currentWidget;
      if (!current) {
        return;
      }
      shell.activateById(current.id);

      return current.refresh().then(() => { current.activate(); });
    },
    isEnabled: () => tracker.currentWidget !== null
  });

  commands.addCommand('calendar:increase-font', {
    label: 'Increase Calendar Font Size',
    execute: () => {
      let options = Calendar.defaultOptions;
      if (options.fontSize < 72) {
        options.fontSize++;
        tracker.forEach(widget => { widget.fontSize = options.fontSize; });
      }
    },
    isEnabled: hasWidget
  });

  commands.addCommand('calendar:decrease-font', {
    label: 'Decrease Calendar Font Size',
    execute: () => {
      let options = Calendar.defaultOptions;
      if (options.fontSize > 9) {
        options.fontSize--;
        tracker.forEach(widget => { widget.fontSize = options.fontSize; });
      }
    },
    isEnabled: hasWidget
  });

  commands.addCommand('calendar:toggle-theme', {
    label: 'Toggle Calendar Theme',
    caption: 'Switch Calendar Theme',
    execute: () => {
      tracker.forEach(widget => {
        if (widget.theme === 'dark') {
          widget.theme = 'light';
        } else {
          widget.theme = 'dark';
        }
      });
    },
    isEnabled: hasWidget
  });
}
