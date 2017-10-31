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
  ISettingRegistry, IStateDB
} from '@quantlab/coreutils';

import {
  ILauncher
} from '@quantlab/launcher';

import {
  SheetTools, ISheetTools, ISpreadsheetTracker,
  SpreadsheetModelFactory, SpreadsheetPanel, SpreadsheetTracker, SpreadsheetFactory
} from '@quantlab/spreadsheet';

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
 * The command IDs used by the sheet plugin.
 */
namespace CommandIDs {
  export
  const interrupt = 'spreadsheet:interrupt-kernel';

  export
  const restart = 'spreadsheet:restart-kernel';

  export
  const reconnectToKernel = 'spreadsheet:reconnect-to-kernel';

  export
  const changeKernel = 'spreadsheet:change-kernel';

  export
  const createConsole = 'spreadsheet:create-console';

  export
  const exportToFormat = 'spreadsheet:export-to-format';
};


/**
 * The class name for the spreadsheet icon from the default theme.
 */
const SPREADSHEET_ICON_CLASS = 'jp-SpreadsheetIcon';

/**
 * The name of the factory that creates Spreadsheet.
 */
const FACTORY = 'Spreadsheet';

/**
 * The allowed Export To ... formats and their human readable labels.
 */
const EXPORT_TO_FORMATS = [
  { 'format': 'html', 'label': 'HTML' },
  { 'format': 'excel', 'label': 'Excel' },
  { 'format': 'pdf', 'label': 'PDF' }
];


/**
 * The spreadsheet widget tracker provider.
 */
export
const trackerPlugin: QuantLabPlugin<ISpreadsheetTracker> = {
  id: 'jupyter.extensions.spreadsheet',
  provides: ISpreadsheetTracker,
  requires: [
    IMainMenu,
    ICommandPalette,
    SpreadsheetPanel.IContentFactory,
    ILayoutRestorer,
    IStateDB,
    ISettingRegistry
  ],
  optional: [ILauncher],
  activate: activateSpreadsheet,
  autoStart: true
};


/**
 * The spreadsheet cell factory provider.
 */
export
const contentFactoryPlugin: QuantLabPlugin<SpreadsheetPanel.IContentFactory> = {
  id: 'jupyter.services.spreadsheet-renderer',
  provides: SpreadsheetPanel.IContentFactory,
  autoStart: true,
  activate: (app: QuantLab) => {
    return new SpreadsheetPanel.ContentFactory();
  }
};

/**
 * The sheet tools extension.
 */
const sheetToolsPlugin: QuantLabPlugin<ISheetTools> = {
  activate: activateSheetTools,
  provides: ISheetTools,
  id: 'jupyter.extensions.sheet-tools',
  autoStart: true,
  requires: [ISpreadsheetTracker, IEditorServices, IStateDB]
};





/**
 * Export the plugin as default.
 */
const plugins: QuantLabPlugin<any>[] = [contentFactoryPlugin, trackerPlugin, sheetToolsPlugin];
export default plugins;

/**
 * Activate the sheet tools extension.
 */
function activateSheetTools(app: QuantLab, tracker: ISpreadsheetTracker, editorServices: IEditorServices, state: IStateDB): Promise<ISheetTools> {
  const id = 'sheet-tools';
  const sheettools = new SheetTools({ tracker });
  const activeCellTool = new SheetTools.ActiveCellTool();
  const slideShow = SheetTools.createSlideShowSelector();
  const nbConvert = SheetTools.createNBConvertSelector();
  const editorFactory = editorServices.factoryService.newInlineEditor
    .bind(editorServices.factoryService);
  const metadataEditor = new SheetTools.MetadataEditorTool({ editorFactory });

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

  sheettools.title.label = 'Sheet Tools';
  sheettools.id = id;
  sheettools.addItem({ tool: activeCellTool, rank: 1 });
  sheettools.addItem({ tool: slideShow, rank: 2 });
  sheettools.addItem({ tool: nbConvert, rank: 3 });
  sheettools.addItem({ tool: metadataEditor, rank: 4 });
  MessageLoop.installMessageHook(sheettools, hook);

  // Wait until the application has finished restoring before rendering.
  Promise.all([state.fetch(id), app.restored]).then(([args]) => {
    const open = (args && args['open'] as boolean) || false;

    // After initial restoration, check if the sheet tools should render.
    if (tracker.size) {
      app.shell.addToLeftArea(sheettools);
      if (open) {
        app.shell.activateById(sheettools.id);
      }
    }

    // For all subsequent widget changes, check if the sheet tools should render.
    app.shell.currentChanged.connect((sender, args) => {
      // If there are any open spreadsheets, add sheet tools to the side panel if
      // it is not already there.
      if (tracker.size) {
        if (!sheettools.isAttached) {
          app.shell.addToLeftArea(sheettools);
        }
        return;
      }
      // If there are no spreadsheets, close sheet tools.
      sheettools.close();
    });
  });

  return Promise.resolve(sheettools);
}


/**
 * Activate the spreadsheet plugin.
 */
function activateSpreadsheet(app: QuantLab, mainMenu: IMainMenu, palette: ICommandPalette, contentFactory: SpreadsheetPanel.IContentFactory, restorer: ILayoutRestorer, state: IStateDB, settingRegistry: ISettingRegistry, launcher: ILauncher | null): ISpreadsheetTracker {
  let manager = app.serviceManager;
  const factory = new SpreadsheetFactory({
    name: FACTORY,
    fileTypes: ['spreadsheet'],
    modelName: 'text',
    defaultFor: ['spreadsheet'],
    //preferKernel: true,
    canStartKernel: true,
    contentFactory: contentFactory
  });

  const { commands, restored } = app;
  const tracker = new SpreadsheetTracker({ namespace: 'spreadsheet' });

  /**
   * Update the setting values.
   */
  function updateSettings(settings: ISettingRegistry.ISettings): void {
    //keyMap = settings.get('keyMap').composite as string | null || keyMap;
    //theme = settings.get('theme').composite as string | null || theme;
  }

  /**
   * Update the settings of the current tracker instances.
   */
  function updateTracker(): void {
    tracker.forEach(widget => {
      if (widget instanceof SpreadsheetPanel) {
        //let cm = widget.editor.editor;
        //cm.setOption('keyMap', keyMap);
        //cm.setOption('theme', theme);
      }
    });
  }

  // Fetch the initial state of the settings.
  Promise.all([settingRegistry.load('jupyter.extensions.spreadsheet'), restored]).then(([settings]) => {
    updateSettings(settings);
    updateTracker();
    settings.changed.connect(() => {
      updateSettings(settings);
      updateTracker();
    });
  }).catch((reason: Error) => {
    console.error(reason.message);
    updateTracker();
  });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: panel => ({ path: panel.context.path, factory: FACTORY }),
    name: panel => panel.context.path,
    when: manager.ready
  });

  // Update the command registry when the spreadsheet state changes.
  tracker.currentChanged.connect(() => {
    if (tracker.size <= 1) {
      commands.notifyCommandChanged(CommandIDs.interrupt);
    }
  });

  let registry = app.docRegistry;
  registry.addModelFactory(new SpreadsheetModelFactory({}));
  registry.addWidgetFactory(factory);
  registry.addCreator({
    name: 'Spreadsheet',
    fileType: 'spreadsheet',
    widgetName: 'Spreadsheet'
  });

  addCommands(app, tracker);
  populatePalette(palette);

  let id = 0; // The ID counter for spreadsheet panels.

  factory.widgetCreated.connect((sender, widget) => {
    // If the spreadsheet panel does not have an ID, assign it one.
    widget.id = widget.id || `spreadsheet-${++id}`;
    widget.title.icon = SPREADSHEET_ICON_CLASS;

    // Notify the instance tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => { tracker.save(widget); });
    // Add the spreadsheet panel to the tracker.
    tracker.add(widget);
  });

  // Add main menu spreadsheet menu.
  mainMenu.addMenu(createMenu(app), { rank: 60 });

  // The launcher callback.
  let callback = (cwd: string, name: string) => {
    return commands.execute(
      'docmanager:new-untitled', { path: cwd, type: 'file', ext: '.xls' }
    ).then(model => {
      return commands.execute('docmanager:open', {
        path: model.path, factory: FACTORY,
        kernel: { name }
      });
    });
  };

  // Add a launcher item if the launcher is available.
  if (launcher) {
    manager.ready.then(() => {
      launcher.add({
        displayName: 'Spreadsheet',
        category: 'Other',
        name: name,
        iconClass: SPREADSHEET_ICON_CLASS,
        callback: callback,
        rank: 2
      })
    });

  }

  //app.contextMenu.addItem({ type: 'separator', selector: '.jp-Spreadsheet', rank: 0 });
  //app.contextMenu.addItem({command: CommandIDs.createConsole, selector: '.jp-Spreadsheet', rank: 3});

  return tracker;
}


/**
 * Add the spreadsheet commands to the application's command registry.
 */
function addCommands(app: QuantLab, tracker: SpreadsheetTracker): void {
  const { commands, shell } = app;

  // Get the current widget and activate unless the args specify otherwise.
  function getCurrent(args: ReadonlyJSONObject): SpreadsheetPanel | null {
    let widget = tracker.currentWidget;
    let activate = args['activate'] !== false;
    if (activate && widget) {
      shell.activateById(widget.id);
    }
    return widget;
  }

  /**
   * Whether there is an active spreadsheet.
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
    label: 'Create Console for Spreadsheet',
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
  commands.addCommand(CommandIDs.exportToFormat, {
    label: args => {
        let formatLabel = (args['label']) as string;
        return (args['isPalette'] ? 'Export To ' : '') + formatLabel;
    },
    execute: args => {
      let current = getCurrent(args);
      if (!current) {
        return;
      }
    },
    isEnabled: hasWidget
  });
}


/**
 * Populate the application's command palette with spreadsheet commands.
 */
function populatePalette(palette: ICommandPalette): void {
  let category = 'Spreadsheet Operations';
  [
    CommandIDs.interrupt,
    CommandIDs.restart,
    CommandIDs.changeKernel,
    CommandIDs.reconnectToKernel,
    CommandIDs.createConsole,
    CommandIDs.exportToFormat
  ].forEach(command => { palette.addItem({ command, category }); });

  EXPORT_TO_FORMATS.forEach(exportToFormat => {
    let args = { 'format': exportToFormat['format'], 'label': exportToFormat['label'], 'isPalette': true };
    palette.addItem({ command: CommandIDs.exportToFormat, category: category, args: args });
  });

}


/**
 * Creates a menu for the spreadsheet.
 */
function createMenu(app: QuantLab): Menu {
  let { commands } = app;
  let menu = new Menu({ commands });

  let exportTo = new Menu({ commands } );

  menu.title.label = 'Sheets';

  exportTo.title.label = "Export to ...";
  EXPORT_TO_FORMATS.forEach(exportToFormat => {
    exportTo.addItem({ command: CommandIDs.exportToFormat, args: exportToFormat });
  });

  menu.addItem({ command: CommandIDs.interrupt });
  menu.addItem({ command: CommandIDs.restart });
  menu.addItem({ command: CommandIDs.changeKernel });
  menu.addItem({ type: 'separator' });
  menu.addItem({ command: CommandIDs.createConsole });
  menu.addItem({ type: 'submenu', submenu: exportTo });

  return menu;
}
