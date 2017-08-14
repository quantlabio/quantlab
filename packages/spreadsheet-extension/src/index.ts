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
  Spreadsheet, SpreadsheetFactory,
  SheetTools
} from '@quantlab/spreadsheet';

/**
 * The command IDs used by the sheet plugin.
 */
namespace CommandIDs {

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

const sheetToolsPlugin: QuantLabPlugin<void> = {
  activate: activateSheetTools,
  id: 'jupyter.extensions.sheet-tools',
  autoStart: false,
  requires: []
};

/**
 * The default sheet extension.
 */
const sheetPlugin: QuantLabPlugin<void> = {
  activate: activateSpreadsheet,
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
 const plugins: QuantLabPlugin<any>[] = [sheetPlugin, sheetToolsPlugin];
export default plugins;

function activateSheetTools(app: QuantLab): void {
  const id = 'sheet-tools';
  const sheettools = new SheetTools();
  sheettools.id = id;
  sheettools.title.label = 'Spreadsheet';

  //app.shell.addToRightArea(sheettools);
  //app.shell.activateById(sheettools.id);
}

/**
 * Activate the spreadsheet plugin.
 */
function activateSpreadsheet(app: QuantLab, restorer: ILayoutRestorer, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): void {
  const factory = new SpreadsheetFactory({
    name: FACTORY,
    fileTypes: ['xls'],
    defaultFor: ['xls']
  });
  const tracker = new InstanceTracker<Spreadsheet>({ namespace: 'spreadsheet' });

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

  const { commands } = app;
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

  // Add command palette and menu items.
  let menu = new Menu({ commands });
  menu.title.label = category;
  [
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
        return commands.execute('docmanager:new-untitled', {
          path: cwd, type: 'file'
        }).then(model => {
          model.type = 'xls';

          let oldPath = model.path;
          let newPath = model.path.split('.');
          let newName = model.name.split('.');

          newPath.pop();
          newPath = newPath.join() + '.xls';
          newName.pop();
          newName = newName.join() + '.xls';

          model.path = newPath;
          model.name = newName;

          services.contents.rename(oldPath, newPath);

          return commands.execute('docmanager:open', {
            path: model.path, factory: FACTORY
          })

        })
      }
    });
  }
}
