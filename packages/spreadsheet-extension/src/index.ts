// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Session, IServiceManager
} from '@quantlab/services';

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
  Menu, Widget
} from '@phosphor/widgets';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  SpreadsheetFactory,
  SheetTools, ISheetTools,
  ISpreadsheetTracker, SpreadsheetTracker
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
 * The spreadsheet widget tracker provider.
 */
const trackerPlugin: QuantLabPlugin<ISpreadsheetTracker> = {
  activate: activateSpreadsheet,
  id: 'jupyter.extensions.spreadsheet',
  provides: ISpreadsheetTracker,
  requires: [
    ILayoutRestorer, IServiceManager, IMainMenu, ICommandPalette
  ],
  optional: [ILauncher],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
const plugins: QuantLabPlugin<any>[] = [trackerPlugin, sheetToolsPlugin];
export default plugins;

function activateSheetTools(app: QuantLab, tracker: ISpreadsheetTracker, editorServices: IEditorServices, state: IStateDB): Promise<ISheetTools> {
  const id = 'sheet-tools';
  const sheettools = new SheetTools({tracker});
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

  sheettools.title.label = 'Spreadsheet';
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
function activateSpreadsheet(app: QuantLab, restorer: ILayoutRestorer, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): ISpreadsheetTracker {
  const factory = new SpreadsheetFactory({
    name: FACTORY,
    fileTypes: ['xls'],
    defaultFor: ['xls']
  });

  const tracker = new SpreadsheetTracker({ namespace: 'spreadsheet' });

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

    // start node.js kernel
    Session.startNew({
      kernelName: 'javascript',
      path: widget.context.path
    }).then( session => {
      widget.session = session;

      let future = session.kernel.requestExecute({ code: 'const ql = require("quantlib");\n;ql'});

      future.done.then( msg => {
        //console.log(msg.content);
      });
      future.onIOPub = (msg) => {
        //console.log(msg.content);
        if(msg.content.hasOwnProperty('data')){
          //console.log(msg.content.data);
        }
      };
      future.onReply = (msg) => {
        //console.log(msg.content);
      };
    });

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

          //model.type = 'xls';
          //let oldPath = model.path;
          //let newPath = model.path.split('.');
          //let newName = model.name.split('.');

          //newPath.pop();
          //newPath = newPath.join() + '.xls';
          //newName.pop();
          //newName = newName.join() + '.xls';

          //model.path = newPath;
          //model.name = newName;

          //return services.contents.rename(oldPath, newPath).then( model => {

            return commands.execute('docmanager:open', {
              path: model.path, factory: FACTORY
            })

          //})

        })
      }
    });
  }

  return tracker;
}
