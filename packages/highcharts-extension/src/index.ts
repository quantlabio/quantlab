// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IServiceManager
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
  HighChartsFactory,
  IChartTools, ChartTools,
  IChartTracker, ChartTracker
} from '@quantlab/highcharts';

/**
 * The command IDs used by the chart plugin.
 */
namespace CommandIDs {

  export
  const save = 'chart:save';
};

const FACTORY = 'HighCharts';

/**
 * The class name for the chart icon in the default theme.
 */
const CHART_ICON_CLASS = 'jp-ChartIcon';

/**
 * The chart tools extension.
 */
const chartToolsPlugin: QuantLabPlugin<IChartTools> = {
  activate: activateChartTools,
  provides: IChartTools,
  id: 'jupyter.extensions.chart-tools',
  autoStart: true,
  requires: [IChartTracker, IEditorServices, IStateDB]
};

/**
 * The chart widget tracker provider.
 */
const trackerPlugin: QuantLabPlugin<IChartTracker> = {
  activate: activateCharts,
  id: 'jupyter.extensions.highcharts',
  provides: IChartTracker,
  requires: [
    ILayoutRestorer, IServiceManager, IMainMenu, ICommandPalette
  ],
  optional: [ILauncher],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
const plugins: QuantLabPlugin<any>[] = [trackerPlugin, chartToolsPlugin];
export default plugins;

function activateChartTools(app: QuantLab, tracker: IChartTracker, editorServices: IEditorServices, state: IStateDB): Promise<IChartTools> {
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

  charttools.title.label = 'Highcharts';
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

function activateCharts(app: QuantLab, restorer: ILayoutRestorer, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): IChartTracker {
  const factory = new HighChartsFactory({
    name: FACTORY,
    fileTypes: ['hc'],
    defaultFor: ['hc']
  });
  const tracker = new ChartTracker({ namespace: 'highcharts' });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  app.docRegistry.addWidgetFactory(factory);
  let ft = app.docRegistry.getFileType('hc');
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
  const category = 'Chart';

  commands.addCommand(CommandIDs.save, {
    label: 'Save',
    execute: () => {
      //const current = tracker.currentWidget;
      //tracker.currentWidget.context.model.fromString(model);
      tracker.currentWidget.context.save().then(() => {
        //tracker.currentWidget.title.className = tracker.currentWidget.title.className.replace(DIRTY_CLASS, '');
        //tracker.currentWidget.context.model.dirty = false;
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
  mainMenu.addMenu(menu, {rank: 80});

  // Add a launcher item if the launcher is available.
  if (launcher) {
    launcher.add({
      displayName: 'Chart',
      category: 'Other',
      rank: 3,
      iconClass: CHART_ICON_CLASS,
      callback: cwd => {
        return commands.execute('docmanager:new-untitled', {
          path: cwd, type: 'file'
        }).then(model => {
          return commands.execute('docmanager:open', {
            path: model.path, factory: FACTORY
          });
        });
      }
    });
  }

  return tracker;
}
