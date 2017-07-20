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
  Sheet
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
  const create = 'sheet:create';
};

/**
 * The class name for the sheet icon in the default theme.
 */
const SHEET_ICON_CLASS = 'jp-SheetIcon';


/**
 * The default sheet extension.
 */
const plugin: QuantLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.sheet',
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

export
let sheetData = [
  ['=$B$2', "Maserati", "Mazda", "Mercedes", "Mini", "=A$1"],
  [2009, 0, 2941, 4303, 354, 5814],
  [2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1'],
  [2011, 4, 2517, 4822, 552, 6127],
  [2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, 4151],
];

/**
 * Activate the sheet plugin.
 */
function activate(app: QuantLab, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): void {
  const { commands, shell } = app;
  const category = 'Sheet';

  commands.addCommand(CommandIDs.create, {
    label: 'New Sheet',
    execute: args => {
      let id = `jp-Sheet-${Private.id++}`;
      let widget = new Sheet();
      widget.id = id;
      widget.title.label = 'Sheet';
      widget.title.icon = 'SHEET_ICON_CLASS';
      widget.title.closable = true;

      shell.addToMainArea(widget);
      shell.activateById(widget.id);

      let container = document.getElementById(id);

      let hot = new Handsontable(container, {
        data: sheetData,
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
    CommandIDs.create
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
