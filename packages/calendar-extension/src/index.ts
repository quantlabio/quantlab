// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILayoutRestorer, QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  ICommandPalette, IMainMenu
} from '@quantlab/apputils';

import {
  IEditorServices
} from '@quantlab/codeeditor';

import {
  IStateDB
} from '@quantlab/coreutils';

import {
  ILauncher
} from '@quantlab/launcher';

import {
  CalendarTools, ICalendarTools, ICalendarTracker,
  CalendarModelFactory, CalendarPanel, CalendarTracker, CalendarFactory
} from '@quantlab/calendar';

import {
  IServiceManager
} from '@quantlab/services';

import {
  ReadonlyJSONObject
} from '@phosphor/coreutils';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  Menu, Widget
} from '@phosphor/widgets';


/**
 * The command IDs used by the calendar plugin.
 */
namespace CommandIDs {
  export
  const open = 'calendar:open';

  export
  const interrupt = 'calendar:interrupt-kernel';

  export
  const restart = 'calendar:restart-kernel';

  export
  const reconnectToKernel = 'calendar:reconnect-to-kernel';

  export
  const changeKernel = 'calendar:change-kernel';

  export
  const createConsole = 'calendar:create-console';
};

/**
 * The class name for the calendar icon in the default theme.
 */
const CALENDAR_ICON_CLASS = 'jp-CalendarIcon';

/**
 * The name of the factory that creates Calendar widgets.
 */
const FACTORY = 'Calendar';


/**
 * The Calendar widget tracker provider.
 */
const trackerPlugin: QuantLabPlugin<ICalendarTracker> = {
  id: 'jupyter.extensions.calendar',
  provides: ICalendarTracker,
  requires: [
    IServiceManager,
    IMainMenu,
    ICommandPalette,
    CalendarPanel.IContentFactory,
    ILayoutRestorer
  ],
  optional: [ILauncher],
  activate: activateCalendar,
  autoStart: true
};


/**
 * The Calendar factory provider.
 */
export
const contentFactoryPlugin: QuantLabPlugin<CalendarPanel.IContentFactory> = {
  id: 'jupyter.services.calendar-renderer',
  provides: CalendarPanel.IContentFactory,
  autoStart: true,
  activate: (app: QuantLab) => {
    return new CalendarPanel.ContentFactory();
  }
};


/**
 * The calendar tools extension.
 */
const calendarToolsPlugin: QuantLabPlugin<ICalendarTools> = {
  activate: activateCalendarTools,
  provides: ICalendarTools,
  id: 'jupyter.extensions.calendar-tools',
  autoStart: true,
  requires: [ICalendarTracker, IEditorServices, IStateDB]
};


/**
 * Export the plugin as default.
 */
const plugins: QuantLabPlugin<any>[] = [contentFactoryPlugin, trackerPlugin, calendarToolsPlugin];
export default plugins;


function activateCalendarTools(app: QuantLab, tracker: ICalendarTracker, editorServices: IEditorServices, state: IStateDB): Promise<ICalendarTools> {
  const id = 'calendar-tools';
  const calendartools = new CalendarTools({tracker});
  const category = CalendarTools.createCategorySelector();
  const nbConvert = CalendarTools.createNBConvertSelector();
  const editorFactory = editorServices.factoryService.newInlineEditor
    .bind(editorServices.factoryService);
  const metadataEditor = new CalendarTools.MetadataEditorTool({ editorFactory });

  // Create message hook for triggers to save to the database.
  const hook = (sender: any, message: Message): boolean => {
    switch (message) {
      case Widget.Msg.ActivateRequest:
        state.save(id, { open: true });
        break;
      case Widget.Msg.AfterHide:
      case Widget.Msg.CloseRequest:
        state.remove(id);
        break;
      default:
        break;
    }
    return true;
  };

  calendartools.title.label = 'Calendar';
  calendartools.id = id;
  calendartools.addItem({ tool: category, rank: 1 });
  calendartools.addItem({ tool: nbConvert, rank: 2 });
  calendartools.addItem({ tool: metadataEditor, rank: 3 });
  MessageLoop.installMessageHook(calendartools, hook);

  // Wait until the application has finished restoring before rendering.
  Promise.all([state.fetch(id), app.restored]).then(([args]) => {
    const open = (args && args['open'] as boolean) || false;

    // After initial restoration, check if the calendar tools should render.
    if (tracker.size) {
      app.shell.addToLeftArea(calendartools);
      if (open) {
        app.shell.activateById(calendartools.id);
      }
    }

    // For all subsequent widget changes, check if the calendar tools should render.
    app.shell.currentChanged.connect((sender, args) => {
      // If there are any open calendar, add calendar tools to the side panel if
      // it is not already there.
      if (tracker.size) {
        if (!calendartools.isAttached) {
          app.shell.addToLeftArea(calendartools);
        }
        return;
      }
      // If there are no calendar, close calendar tools.
      calendartools.close();
    });
  });

  return Promise.resolve(calendartools);
}


/**
 * Activate the calendar plugin.
 */
function activateCalendar(app: QuantLab, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, contentFactory: CalendarPanel.IContentFactory, restorer: ILayoutRestorer, launcher: ILauncher | null): ICalendarTracker {
  const factory = new CalendarFactory({
    name: FACTORY,
    fileTypes: ['ics'],
    modelName: 'text',
    defaultFor: ['ics'],
    //preferKernel: true,
    canStartKernel: true,
    contentFactory: contentFactory
  });

  const { commands } = app;
  const tracker = new CalendarTracker({ namespace: 'calendar' });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path,
    when: services.ready
  });

  // Update the command registry when the Calendar state changes.
  tracker.currentChanged.connect(() => {
    if (tracker.size <= 1) {
      commands.notifyCommandChanged(CommandIDs.interrupt);
    }
  });

  let registry = app.docRegistry;
  registry.addModelFactory(new CalendarModelFactory({}));
  registry.addWidgetFactory(factory);
  registry.addCreator({
    name: 'Calendar',
    fileType: 'calendar',
    widgetName: 'Calendar'
  });

  addCommands(app, services, tracker);
  populatePalette(palette);

  let id = 0; // The ID counter for Calendar panels.

  factory.widgetCreated.connect((sender, widget) => {
    // If the Calendar panel does not have an ID, assign it one.
    widget.id = widget.id || `calendar-${++id}`;
    widget.title.icon = CALENDAR_ICON_CLASS;

    // Notify the instance tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => { tracker.save(widget); });
    // Track the widget.
    tracker.add(widget);
  });

  // Add main menu Calendar menu.
  mainMenu.addMenu(createMenu(app), { rank: 80 });

  // The launcher callback.
  let callback = (cwd: string, name: string) => {
    return commands.execute(
      'docmanager:new-untitled', { path: cwd, type: 'file' }
    ).then(model => {
      return commands.execute('docmanager:open', {
        path: model.path, factory: FACTORY,
        kernel: { name }
      });
    });
  };

  // Add a launcher item if the launcher is available.
  if (launcher) {
    services.ready.then(() => {
      launcher.add({
        displayName: 'Calendar',
        category: 'Other',
        name: name,
        iconClass: CALENDAR_ICON_CLASS,
        callback: callback,
        rank: 5
      })
    });

  }

  //app.contextMenu.addItem({ type: 'separator', selector: '.jp-Spreadsheet', rank: 0 });
  //app.contextMenu.addItem({command: CommandIDs.createConsole, selector: '.jp-Spreadsheet', rank: 3});

  return tracker;
}

/**
 * Add the Calendar commands to the application's command registry.
 */
function addCommands(app: QuantLab, services: IServiceManager, tracker: CalendarTracker): void {
  const { commands, shell } = app;

  // Get the current widget and activate unless the args specify otherwise.
  function getCurrent(args: ReadonlyJSONObject): CalendarPanel | null {
    let widget = tracker.currentWidget;
    let activate = args['activate'] !== false;
    if (activate && widget) {
      shell.activateById(widget.id);
    }
    return widget;
  }

  /**
   * Whether there is an active Calendar.
   */
  function hasWidget(): boolean {
    return tracker.currentWidget !== null;
  }

  commands.addCommand(CommandIDs.restart, {
    label: 'Restart Kernel',
    execute: args => {
      let current = getCurrent(args);
      if (!current) {
        return;
      }
      current.session.restart();
    },
    isEnabled: hasWidget
  });
  commands.addCommand(CommandIDs.interrupt, {
    label: 'Interrupt Kernel',
    execute: args => {
      let current = getCurrent(args);
      if (!current) {
        return;
      }
      let kernel = current.context.session.kernel;
      if (kernel) {
        return kernel.interrupt();
      }
    },
    isEnabled: hasWidget
  });
  commands.addCommand(CommandIDs.changeKernel, {
    label: 'Change Kernel',
    execute: args => {
      let current = getCurrent(args);
      if (!current) {
        return;
      }
      return current.context.session.selectKernel();
    },
    isEnabled: hasWidget
  });
  commands.addCommand(CommandIDs.reconnectToKernel, {
    label: 'Reconnect To Kernel',
    execute: args => {
      let current = getCurrent(args);
      if (!current) {
        return;
      }
      let kernel = current.context.session.kernel;
      if (!kernel) {
        return;
      }
      return kernel.reconnect();
    },
    isEnabled: hasWidget
  });
  commands.addCommand(CommandIDs.createConsole, {
    label: 'Create Console for Calendar',
    execute: args => {
      let current = getCurrent(args);
      if (!current) {
        return;
      }
      let widget = tracker.currentWidget;
      if (!widget) {
        return;
      }
      let options: ReadonlyJSONObject = {
        path: widget.context.path,
        preferredLanguage: widget.context.model.defaultKernelLanguage,
        activate: args['activate']
      };
      return commands.execute('console:create', options);
    },
    isEnabled: hasWidget
  });
}

/**
 * Populate the application's command palette with calendar commands.
 */
function populatePalette(palette: ICommandPalette): void {
  let category = 'Calendar Operations';
  [
    CommandIDs.interrupt,
    CommandIDs.restart,
    CommandIDs.changeKernel,
    CommandIDs.reconnectToKernel,
    CommandIDs.createConsole
  ].forEach(command => { palette.addItem({ command, category }); });

}


/**
 * Creates a menu for the Calendar.
 */
function createMenu(app: QuantLab): Menu {
  let { commands } = app;
  let menu = new Menu({ commands });

  menu.title.label = 'Calendar';

  menu.addItem({ command: CommandIDs.interrupt });
  menu.addItem({ command: CommandIDs.restart });
  menu.addItem({ command: CommandIDs.changeKernel });
  menu.addItem({ type: 'separator' });
  menu.addItem({ command: CommandIDs.createConsole });

  return menu;
}
