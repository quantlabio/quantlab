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

import * as Handsontable from 'handsontable';

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

/**
 * get data for sheet opton.data.
 */
function getData(): any[] {
  return [
    ['','Kia','Nissan','Toyota','Honda','Mazda','Ford'],
    [2012,10,11,12,13,15,16],
    [2013,10,11,12,13,15,16],
    [2014,10,11,12,13,15,16],
    [2015,10,11,12,13,15,16],
    [2016,10,11,12,13,15,16]
  ];
}
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
        data: getData(),
        rowHeaders: true,
        colHeaders: true,
        manualColumnResize: true,
        manualRowResize: true,
        minRows: 128,
        minCols: 32,
        colWidths: 100,
        contextMenu: false,
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
      category: 'Other',
      rank: 1,
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
