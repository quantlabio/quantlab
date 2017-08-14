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
  HighCharts, HighChartsFactory,
  ChartTools
} from '@quantlab/highcharts';

/**
 * The command IDs used by the sheet plugin.
 */
namespace CommandIDs {

  export
  const save = 'chart:save';
};

const FACTORY = 'HighCharts';

/**
 * The class name for the sheet icon in the default theme.
 */
const CHART_ICON_CLASS = 'jp-ChartIcon';

const chartToolsPlugin: QuantLabPlugin<void> = {
  activate: activateChartTools,
  id: 'jupyter.extensions.chart-tools',
  autoStart: false,
  requires: []
};

/**
 * The default chart extension.
 */
const chartPlugin: QuantLabPlugin<void> = {
  activate: activateHighCharts,
  id: 'jupyter.extensions.highcharts',
  requires: [
    ILayoutRestorer, IServiceManager, IMainMenu, ICommandPalette
  ],
  optional: [ILauncher],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
const plugins: QuantLabPlugin<any>[] = [chartPlugin, chartToolsPlugin];
export default plugins;

function activateChartTools(app: QuantLab): void {
  const id = 'chart-tools';
  const charttools = new ChartTools();
  charttools.id = id;
  charttools.title.label = 'Chart';

  //app.shell.addToRightArea(charttools);
  //app.shell.activateById(charttools.id);
}

function activateHighCharts(app: QuantLab, restorer: ILayoutRestorer, services: IServiceManager, mainMenu: IMainMenu, palette: ICommandPalette, launcher: ILauncher | null): void {
  const factory = new HighChartsFactory({
    name: FACTORY,
    fileTypes: ['hc'],
    defaultFor: ['hc']
  });
  const tracker = new InstanceTracker<HighCharts>({ namespace: 'highcharts' });

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
          path: cwd, type: 'hc'
        }).then(model => {
          return commands.execute('docmanager:open', {
            path: model.path, factory: FACTORY
          });
        });
      }
    });
  }
}
