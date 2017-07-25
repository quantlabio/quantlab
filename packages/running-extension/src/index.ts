// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILayoutRestorer, QuantLab, QuantLabPlugin
} from '@quantlab/application';
 
import {
  IServiceManager
} from '@quantlab/services';

import {
  RunningSessions
} from '@quantlab/running';


/**
 * The default running sessions extension.
 */
const plugin: QuantLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.running-sessions',
  requires: [IServiceManager, ILayoutRestorer],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;


/**
 * Activate the running plugin.
 */
function activate(app: QuantLab, services: IServiceManager, restorer: ILayoutRestorer): void {
  let running = new RunningSessions({ manager: services });
  running.id = 'jp-running-sessions';
  running.title.label = 'Running';

  // Let the application restorer track the running panel for restoration of
  // application state (e.g. setting the running panel as the current side bar
  // widget).
  restorer.add(running, 'running-sessions');

  running.sessionOpenRequested.connect((sender, model) => {
    let path = model.path;
    if (model.type.toLowerCase() === 'console') {
      app.commands.execute('console:open', { path });
    } else {
      app.commands.execute('docmanager:open', { path });
    }
  });

  running.terminalOpenRequested.connect((sender, model) => {
    app.commands.execute('terminal:open', { name: model.name });
  });

  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.
  app.shell.addToLeftArea(running, { rank: 200 });
}
