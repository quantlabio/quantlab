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
  ChartTools, IChartTools, IHighChartsTracker,
  HighChartsModelFactory, HighChartsPanel, HighChartsTracker, HighChartsFactory
} from '@quantlab/highcharts';

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
 * The command IDs used by the chart plugin.
 */
namespace CommandIDs {

  export
  const interrupt = 'highcharts:interrupt-kernel';

  export
  const restart = 'highcharts:restart-kernel';

  export
  const reconnectToKernel = 'highcharts:reconnect-to-kernel';

  export
  const changeKernel = 'highcharts:change-kernel';

  export
  const createConsole = 'highcharts:create-console';

};


/**
 * The class name for the chart icon in the default theme.
 */
const HIGHCHARTS_ICON_CLASS = 'jp-ChartIcon';

/**
 * The name of the factory that creates highcharts.
 */
const FACTORY = 'HighCharts';


/**
 * The highchart widget tracker provider.
 */
const trackerPlugin: QuantLabPlugin<IHighChartsTracker> = {
  id: 'jupyter.extensions.highcharts',
  provides: IHighChartsTracker,
  requires: [
    IMainMenu,
    ICommandPalette,
    HighChartsPanel.IContentFactory,
    ILayoutRestorer,
    IStateDB,
    ISettingRegistry
  ],
  optional: [ILauncher],
  activate: activateHighCharts,
  autoStart: true
};


/**
 * The highchart factory provider.
 */
export
const contentFactoryPlugin: QuantLabPlugin<HighChartsPanel.IContentFactory> = {
  id: 'jupyter.services.highchart-renderer',
  provides: HighChartsPanel.IContentFactory,
  autoStart: true,
  activate: (app: QuantLab) => {
    return new HighChartsPanel.ContentFactory();
  }
};


/**
 * The chart tools extension.
 */
const chartToolsPlugin: QuantLabPlugin<IChartTools> = {
  activate: activateChartTools,
  provides: IChartTools,
  id: 'jupyter.extensions.chart-tools',
  autoStart: true,
  requires: [IHighChartsTracker, IEditorServices, IStateDB]
};



/**
 * Export the plugin as default.
 */
const plugins: QuantLabPlugin<any>[] = [contentFactoryPlugin, trackerPlugin, chartToolsPlugin];
export default plugins;

function activateChartTools(app: QuantLab, tracker: IHighChartsTracker, editorServices: IEditorServices, state: IStateDB): Promise<IChartTools> {
  const id = 'chart-tools';
  const charttools = new ChartTools({tracker});
  const category = ChartTools.createCategorySelector();
  const nbConvert = ChartTools.createNBConvertSelector();
  const editorFactory = editorServices.factoryService.newInlineEditor
    .bind(editorServices.factoryService);
  const metadataEditor = new ChartTools.MetadataEditorTool({ editorFactory });

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

  charttools.title.label = 'Chart Tools';
  charttools.id = id;
  charttools.addItem({ tool: category, rank: 1 });
  charttools.addItem({ tool: nbConvert, rank: 2 });
  charttools.addItem({ tool: metadataEditor, rank: 3 });
  MessageLoop.installMessageHook(charttools, hook);

  // Wait until the application has finished restoring before rendering.
  Promise.all([state.fetch(id), app.restored]).then(([args]) => {
    const open = (args && args['open'] as boolean) || false;

    // After initial restoration, check if the chart tools should render.
    if (tracker.size) {
      app.shell.addToLeftArea(charttools);
      if (open) {
        app.shell.activateById(charttools.id);
      }
    }

    // For all subsequent widget changes, check if the chart tools should render.
    app.shell.currentChanged.connect((sender, args) => {
      // If there are any open chart, add chart tools to the side panel if
      // it is not already there.
      if (tracker.size) {
        if (!charttools.isAttached) {
          app.shell.addToLeftArea(charttools);
        }
        return;
      }
      // If there are no chart, close chart tools.
      charttools.close();
    });
  });

  return Promise.resolve(charttools);
}

function activateHighCharts(app: QuantLab, mainMenu: IMainMenu, palette: ICommandPalette, contentFactory: HighChartsPanel.IContentFactory, restorer: ILayoutRestorer, state: IStateDB, settingRegistry: ISettingRegistry, launcher: ILauncher | null): IHighChartsTracker {
  let manager = app.serviceManager;
  const factory = new HighChartsFactory({
    name: FACTORY,
    fileTypes: ['hc'],
    modelName: 'text',
    defaultFor: ['hc'],
    //preferKernel: true,
    canStartKernel: true,
    contentFactory: contentFactory
  });

  const { commands, restored } = app;
  const tracker = new HighChartsTracker({ namespace: 'highcharts' });

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
      if (widget instanceof HighChartsPanel) {
        //let cm = widget.editor.editor;
        //cm.setOption('keyMap', keyMap);
        //cm.setOption('theme', theme);
      }
    });
  }

  // Fetch the initial state of the settings.
  Promise.all([settingRegistry.load('jupyter.extensions.highcharts'), restored]).then(([settings]) => {
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
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path,
    when: manager.ready
  });

  // Update the command registry when the highcharts state changes.
  tracker.currentChanged.connect(() => {
    if (tracker.size <= 1) {
      commands.notifyCommandChanged(CommandIDs.interrupt);
    }
  });

  let registry = app.docRegistry;
  registry.addModelFactory(new HighChartsModelFactory({}));
  registry.addWidgetFactory(factory);
  registry.addCreator({
    name: 'HighCharts',
    fileType: 'highcharts',
    widgetName: 'HighCharts'
  });

  addCommands(app, tracker);
  populatePalette(palette);

  let id = 0; // The ID counter for HighCharts panels.

  factory.widgetCreated.connect((sender, widget) => {
    // If the highcharts panel does not have an ID, assign it one.
    widget.id = widget.id || `highcharts-${++id}`;
    widget.title.icon = HIGHCHARTS_ICON_CLASS;

    // Notify the instance tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => { tracker.save(widget); });
    // Add the HighCharts panel to the tracker.
    tracker.add(widget);
  });

  // Add main menu HighCharts menu.
  mainMenu.addMenu(createMenu(app), { rank: 70 });

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
    manager.ready.then(() => {
      launcher.add({
        displayName: 'HighCharts',
        category: 'Other',
        name: name,
        iconClass: HIGHCHARTS_ICON_CLASS,
        callback: callback,
        rank: 3
      })
    });

  }

  //app.contextMenu.addItem({ type: 'separator', selector: '.jp-Spreadsheet', rank: 0 });
  //app.contextMenu.addItem({command: CommandIDs.createConsole, selector: '.jp-Spreadsheet', rank: 3});

  return tracker;
}


/**
 * Add the HighCharts commands to the application's command registry.
 */
function addCommands(app: QuantLab, tracker: HighChartsTracker): void {
  const { commands, shell } = app;

  // Get the current widget and activate unless the args specify otherwise.
  function getCurrent(args: ReadonlyJSONObject): HighChartsPanel | null {
    let widget = tracker.currentWidget;
    let activate = args['activate'] !== false;
    if (activate && widget) {
      shell.activateById(widget.id);
    }
    return widget;
  }

  /**
   * Whether there is an active HighCharts.
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
    label: 'Create Console for HighCharts',
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
 * Populate the application's command palette with HighCharts commands.
 */
function populatePalette(palette: ICommandPalette): void {
  let category = 'HighCharts Operations';
  [
    CommandIDs.interrupt,
    CommandIDs.restart,
    CommandIDs.changeKernel,
    CommandIDs.reconnectToKernel,
    CommandIDs.createConsole
  ].forEach(command => { palette.addItem({ command, category }); });

}


/**
 * Creates a menu for the HighCharts.
 */
function createMenu(app: QuantLab): Menu {
  let { commands } = app;
  let menu = new Menu({ commands });

  menu.title.label = 'Charts';

  menu.addItem({ command: CommandIDs.interrupt });
  menu.addItem({ command: CommandIDs.restart });
  menu.addItem({ command: CommandIDs.changeKernel });
  menu.addItem({ type: 'separator' });
  menu.addItem({ command: CommandIDs.createConsole });

  return menu;
}
