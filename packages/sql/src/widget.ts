// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  DataGrid
} from '@phosphor/datagrid';

import {
  Message
} from '@phosphor/messaging';

import {
  SplitPanel, PanelLayout, Widget
} from '@phosphor/widgets';

import {
  CodeEditor, CodeEditorWrapper
} from '@quantlab/codeeditor';

import {
  IClientSession, Toolbar
} from '@quantlab/apputils';

import {
  PathExt
} from '@quantlab/coreutils';

import {
  ABCWidgetFactory, DocumentRegistry
} from '@quantlab/docregistry';

import {
  ToolbarItems
} from './toolbar';


/**
 * The class name added to a SQL viewer.
 */
const SQL_CLASS = 'jp-SQL';

/**
 * The class name added to a SQL viewer toolbar.
 */
const SQL_TOOLBAR_CLASS = 'jp-SQL-toolbar';

/**
 * The class name added to a SQL viewer datagrid.
 */
const SQL_GRID_CLASS = 'jp-SQL-grid';


/**
 * SQL workbench class
 */
export
class SQL extends Widget implements DocumentRegistry.IReadyWidget {
  /**
   * Construct a new SQL widget.
   */
  constructor(options: SQL.IOptions) {
    super();

    let context = this._context = options.context;
    let layout = this.layout = new PanelLayout();

    this._panel = new SplitPanel({
      orientation: 'vertical',
      renderer: SplitPanel.defaultRenderer,
      spacing: 1
    });

    this.addClass(SQL_CLASS);
    this.title.label = PathExt.basename(context.path);

    this._editor = new CodeEditorWrapper({model: this._model, factory: options.editorFactory});
    this._editor.addClass('jp-InputArea-editor');

    this._grid = new DataGrid();
    this._grid.addClass(SQL_GRID_CLASS);
    this._grid.headerVisibility = 'column';

    this._toolbar = new Toolbar();
    this._toolbar.addClass(SQL_TOOLBAR_CLASS);

    layout.addWidget(this._toolbar);
    layout.addWidget(this._panel);
    this._panel.addWidget(this._editor);
    this._panel.addWidget(this._grid);

    context.pathChanged.connect(this._onPathChanged, this);

    this._context.ready.then(() => {
      this._editor.editor.model.value.text = this._context.model.toString();
      this._editor.editor.model.mimeType = 'text/x-sql';
      this._updateGrid();
      this._ready.resolve(undefined);
    });
  }

  /**
   * The SQL widget's context.
   */
  get context(): DocumentRegistry.Context {
    return this._context;
  }

  /**
   * A promise that resolves when the csv viewer is ready.
   */
  get ready() {
    return this._ready.promise;
  }

  /**
   * Get the toolbar used by the widget.
   */
  get toolbar(): Toolbar<Widget> {
    return (this.layout as PanelLayout).widgets[0] as Toolbar<Widget>;
  }

  /**
   * The client session used by the panel.
   */
  get session(): IClientSession {
    return this._context ? this._context.session : null;
  }

  /**
   * Dispose of the resources used by the widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    super.dispose();
    this._editor.dispose();
    this._grid.dispose();
    this._panel.dispose();
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this.node.tabIndex = -1;
    this.node.focus();
  }


  /**
   * Handle a change in path.
   */
  private _onPathChanged(): void {
    this.title.label = PathExt.basename(this._context.path);
  }

  /**
   * Create the json model for the grid.
   */
  private _updateGrid(): void {
    //let text = this._context.model.toString();

    //let [columns, data];
    //let fields = columns.map(name => ({ name, type: 'string' }));
    //this._grid.model = new JSONModel({ data, schema: { fields } });
  }

  private _context: DocumentRegistry.Context;
  private _panel: SplitPanel;
  private _grid: DataGrid;
  private _editor: CodeEditorWrapper;
  private _toolbar: Toolbar<Widget>;
  private _model = new CodeEditor.Model();
  private _ready = new PromiseDelegate<void>();
}


/**
 * A namespace for `SQL` statics.
 */
export
namespace SQL {
  /**
   * Instantiation options for SQL widgets.
   */
  export
  interface IOptions {
    /**
     * The document context for the SQL being rendered by the widget.
     */
    context: DocumentRegistry.Context;

    /**
     * The editor factory used by the raw editor.
     */
    editorFactory: CodeEditor.Factory;
  }
}


/**
 * A widget factory for SQL widgets.
 */
export
class SQLFactory extends ABCWidgetFactory<SQL, DocumentRegistry.IModel> {

    constructor(options: DocumentRegistry.IWidgetFactoryOptions, factory: CodeEditor.Factory){
      super(options);
      this._editorFactory = factory;
    }

  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.Context): SQL {
    let panel = new SQL({ context: context, editorFactory: this._editorFactory });

    ToolbarItems.populateDefaults(panel);

    return panel;
  }

  private _editorFactory: CodeEditor.Factory;
}
