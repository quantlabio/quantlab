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
  Spreadsheet, SpreadsheetFactory
} from '@quantlab/spreadsheet';

import * as Handsontable
  from '@quantlab/handsontable';

/**
 * The command IDs used by the sheet plugin.
 */
namespace CommandIDs {
  export
  const open = 'spreadsheet:open';

  export
  const save = 'spreadsheet:save';
};

/**
 * The name of the factory that creates Spreadsheet widgets.
 */
const FACTORY = 'Spreadsheet';

/**
 * The class name for the sheet icon in the default theme.
 */
const SPREADSHEET_ICON_CLASS = 'jp-SpreadsheetIcon';

/**
 * The class name added to a dirty widget.
 */
const DIRTY_CLASS = 'jp-mod-dirty';

/**
 * The default sheet extension.
 */
const plugin: QuantLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.spreadsheet',
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
 * Activate the spreadsheet plugin.
 */
function activate(app: QuantLab, restorer: ILayoutRestorer, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): void {
  const factory = new SpreadsheetFactory({
    name: FACTORY,
    fileTypes: ['spreadsheet'],
    defaultFor: ['spreadsheet']
  });
  const tracker = new InstanceTracker<Spreadsheet>({ namespace: 'spreadsheet' });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  app.docRegistry.addWidgetFactory(factory);
  let ft = app.docRegistry.getFileType('spreadsheet');
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
  const category = 'Spreadsheet';

  commands.addCommand(CommandIDs.save, {
    label: 'Save',
    execute: () => {
      const current = tracker.currentWidget;
      const model = current.modelString();
      tracker.currentWidget.context.model.fromString(model);
      tracker.currentWidget.context.save().then(() => {
        tracker.currentWidget.title.className = tracker.currentWidget.title.className.replace(DIRTY_CLASS, '');
        tracker.currentWidget.context.model.dirty = false;
      });
    }
  });

  commands.addCommand(CommandIDs.open, {
    label: 'Open',
    execute: args => {
      let id = `jp-Spreadsheet-${Private.id++}`;

      let widget = new Spreadsheet({context:null});
      widget.id = id;
      widget.title.label = 'Spreadsheet';
      widget.title.icon = 'SPREADSHEET_ICON_CLASS';
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
        formulas: true,
        comments: true
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
      displayName: 'Spreadsheet',
      category: 'Other',
      rank: 2,
      iconClass: SPREADSHEET_ICON_CLASS,
      callback: cwd => {
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
