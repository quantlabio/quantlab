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
  Sheet, SheetFactory
} from '@quantlab/sheet';

//import 'hot-formula-parser/dist/formula-parser.js';

import * as Handsontable
  from 'handsontable';

//import 'hot-formula-parser/dist/formula.js';

/**
 * The command IDs used by the sheet plugin.
 */
namespace CommandIDs {
  export
  const open = 'sheet:open';

  export
  const save = 'sheet:save';
};

/**
 * The name of the factory that creates Sheet widgets.
 */
const FACTORY = 'Sheet';

/**
 * The class name for the sheet icon in the default theme.
 */
const SHEET_ICON_CLASS = 'jp-SpreadsheetIcon';


/**
 * The default sheet extension.
 */
const plugin: QuantLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.sheet',
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
 * Activate the sheet plugin.
 */
function activate(app: QuantLab, restorer: ILayoutRestorer, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): void {
  const factory = new SheetFactory({
    name: FACTORY,
    fileTypes: ['xls'],
    defaultFor: ['xls']
  });
  const tracker = new InstanceTracker<Sheet>({ namespace: 'sheet' });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  app.docRegistry.addWidgetFactory(factory);
  let ft = app.docRegistry.getFileType('xls');
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
  const category = 'Sheet';

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
      let id = `jp-Sheet-${Private.id++}`;

      let widget = new Sheet({context:null});
      widget.id = id;
      widget.title.label = 'Sheet';
      widget.title.icon = 'SHEET_ICON_CLASS';
      widget.title.closable = true;

      shell.addToMainArea(widget);
      shell.activateById(widget.id);

      let container = document.getElementById(id);

      let hot = new Handsontable(container, {
        data: [[]],
        rowHeaders: true,
        colHeaders: true,
        manualColumnResize: true,
        manualRowResize: true,
        minRows: 128,
        minCols: 32,
        colWidths: 100,
        contextMenu: true,
        //formulas: true,
        outsideClickDeselects: false
      });

      hot.render();

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
  mainMenu.addMenu(menu, {rank: 70});

  // Add a launcher item if the launcher is available.
  if (launcher) {
    launcher.add({
      displayName: 'Sheet',
      category: 'Quantitative Finance',
      rank: 2,
      iconClass: SHEET_ICON_CLASS,
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
