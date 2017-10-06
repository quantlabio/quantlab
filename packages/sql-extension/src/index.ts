// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILayoutRestorer, QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  IEditorServices
} from '@quantlab/codeeditor';

import {
  InstanceTracker
} from '@quantlab/apputils';

import {
  SQL, SQLFactory
} from '@quantlab/sql';


/**
 * The name of the factory that creates CSV widgets.
 */
const FACTORY = 'SQL';


/**
 * The table file handler extension.
 */
const plugin: QuantLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.sql-handler',
  requires: [ILayoutRestorer, IEditorServices],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;


/**
 * Activate the table widget extension.
 */
function activate(app: QuantLab, restorer: ILayoutRestorer, editorServices: IEditorServices,): void {

  const factoryService = editorServices.factoryService;
  const editorFactory = factoryService.newInlineEditor.bind(factoryService);

  const factory = new SQLFactory({
    name: FACTORY,
    fileTypes: ['sql'],
    defaultFor: ['sql'],
    readOnly: true
  }, editorFactory);
  const tracker = new InstanceTracker<SQL>({ namespace: 'sql' });


  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  app.docRegistry.addWidgetFactory(factory);
  let ft = app.docRegistry.getFileType('sql');
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
}
