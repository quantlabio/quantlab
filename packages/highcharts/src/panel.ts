// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Kernel, KernelMessage
} from '@quantlab/services';

import {
  PromiseDelegate, Token
} from '@phosphor/coreutils';

import {
  Message
} from '@phosphor/messaging';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  PanelLayout, Widget
} from '@phosphor/widgets';

import {
  IClientSession, Toolbar
} from '@quantlab/apputils';

import {
  IChangedArgs
} from '@quantlab/coreutils';

import {
  DocumentRegistry
} from '@quantlab/docregistry';

import {
  HighCharts
} from './widget';

import {
  IHighChartsModel
} from './model';


/**
 * The class name added to HighCharts panels.
 */
const HIGHCHARTS_PANEL_CLASS = 'jp-HighChartsPanel';

const HIGHCHARTS_TOOLBAR_CLASS = 'jp-HighCharts-toolbar';

const HIGHCHARTS_CLASS = 'jp-HighCharts';

/**
 * The class name added to a dirty widget.
 */
const DIRTY_CLASS = 'jp-mod-dirty';


/**
 * A widget that hosts a HighCharts toolbar and content area.
 *
 * #### Notes
 * The widget keeps the document metadata in sync with the current
 * kernel on the context.
 */
export
class HighChartsPanel extends Widget implements DocumentRegistry.IReadyWidget {
  /**
   * Construct a new HighCharts panel.
   */
  constructor(options: HighChartsPanel.IOptions) {
    super();
    this.addClass(HIGHCHARTS_PANEL_CLASS);

    let contentFactory = this.contentFactory = (
      options.contentFactory || HighChartsPanel.defaultContentFactory
    );

    let layout = this.layout = new PanelLayout();

    // Toolbar
    let toolbar = new Toolbar();
    toolbar.addClass(HIGHCHARTS_TOOLBAR_CLASS);

    // HighCharts
    let hcOptions = {
      languagePreference: options.languagePreference,
      contentFactory: contentFactory
    };
    let highcharts = this.highcharts = contentFactory.createHighCharts(hcOptions);
    highcharts.addClass(HIGHCHARTS_CLASS);

    layout.addWidget(toolbar);
    layout.addWidget(this.highcharts);
  }

  /**
   * A signal emitted when the panel has been activated.
   */
  get activated(): ISignal<this, void> {
    return this._activated;
  }

  /**
   * A signal emitted when the panel context changes.
   */
  get contextChanged(): ISignal<this, void> {
    return this._contextChanged;
  }

  /**
   * The client session used by the panel.
   */
  get session(): IClientSession {
    return this._context ? this._context.session : null;
  }

  /**
   * A promise that resolves when the HighCharts panel is ready.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * The factory used by the widget.
   */
  readonly contentFactory: HighChartsPanel.IContentFactory;

  /**
   * The highcharts used by the widget.
   */
  readonly highcharts: HighCharts;

  /**
   * Get the toolbar used by the widget.
   */
  get toolbar(): Toolbar<Widget> {
    return (this.layout as PanelLayout).widgets[0] as Toolbar<Widget>;
  }

  /**
   * The model for the widget.
   */
  get model(): IHighChartsModel {
    return this.highcharts ? this.highcharts.model : null;
  }

  /**
   * The document context for the widget.
   *
   * #### Notes
   * Changing the context also changes the model on the
   * `content`.
   */
  get context(): DocumentRegistry.IContext<IHighChartsModel> {
    return this._context;
  }
  set context(newValue: DocumentRegistry.IContext<IHighChartsModel>) {
    newValue = newValue || null;
    if (newValue === this._context) {
      return;
    }
    let oldValue = this._context;
    this._context = newValue;
    // Trigger private, protected, and public changes.
    this._onContextChanged(oldValue, newValue);
    this.onContextChanged(oldValue, newValue);
    this._contextChanged.emit(void 0);

    if (!oldValue) {
      newValue.ready.then(() => {

        this._ready.resolve(undefined);
      });
    }

  }

  /**
   * Dispose of the resources used by the widget.
   */
  dispose(): void {
    this._context = null;
    this.highcharts.dispose();
    super.dispose();
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the dock panel's node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mouseup':
    case 'mouseout':
      let target = event.target as HTMLElement;
      if (this.toolbar.node.contains(document.activeElement) &&
          target.localName !== 'select') {
        this.highcharts.node.focus();
      }
      break;
    default:
      break;
    }
  }

  /**
   * Handle `after-attach` messages for the widget.
   */
  protected onAfterAttach(msg: Message): void {
    this.toolbar.node.addEventListener('mouseup', this);
    this.toolbar.node.addEventListener('mouseout', this);
  }

  /**
   * Handle `before-detach` messages for the widget.
   */
  protected onBeforeDetach(msg: Message): void {
    this.toolbar.node.removeEventListener('mouseup', this);
    this.toolbar.node.removeEventListener('mouseout', this);
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this.highcharts.activate();
    this._activated.emit(void 0);
  }

  /**
   * Handle a change to the document context.
   *
   * #### Notes
   * The default implementation is a no-op.
   */
  protected onContextChanged(oldValue: DocumentRegistry.IContext<IHighChartsModel>, newValue: DocumentRegistry.IContext<IHighChartsModel>): void {
    // This is a no-op.
  }


  /**
   * Handle a change in the model state.
   */
  protected onModelStateChanged(sender: IHighChartsModel, args: IChangedArgs<any>): void {
    if (args.name === 'dirty') {
      this._handleDirtyState();
    }
  }

  /**
   * Handle a change to the document path.
   */
  protected onPathChanged(sender: DocumentRegistry.IContext<IHighChartsModel>, path: string): void {
    this.title.label = path.split('/').pop();
  }

  /**
   * Handle a change in the context.
   */
  private _onContextChanged(oldValue: DocumentRegistry.IContext<IHighChartsModel>, newValue: DocumentRegistry.IContext<IHighChartsModel>): void {
    if (oldValue) {
      oldValue.pathChanged.disconnect(this.onPathChanged, this);
      oldValue.session.kernelChanged.disconnect(this._onKernelChanged, this);
      if (oldValue.model) {
        oldValue.model.stateChanged.disconnect(this.onModelStateChanged, this);
      }
    }
    if (!newValue) {
      this._onKernelChanged(null, null);
      return;
    }
    let context = newValue;
    this.highcharts.model = newValue.model;
    this._handleDirtyState();
    newValue.model.stateChanged.connect(this.onModelStateChanged, this);
    context.session.kernelChanged.connect(this._onKernelChanged, this);

    // Clear the cells when the context is initially populated.
    if (!newValue.isReady) {
      newValue.ready.then(() => {
        if (this.isDisposed) {
          return;
        }

        this.highcharts.createChart();

        //let model = newValue.model;
        // Clear the undo state of the cells.
        /*
        if (model) {
          model.cells.clearUndo();
          each(this.highcharts.widgets, widget => {
            widget.editor.clearHistory();
          });
        }
        */
      });
    }

    // Handle the document title.
    this.onPathChanged(context, context.path);
    context.pathChanged.connect(this.onPathChanged, this);
  }

  execute(code:string): Kernel.IFuture {
      let content: KernelMessage.IExecuteRequest = {
        code,
        stop_on_error: true
      };

      if (!this.session.kernel) {
        throw Error('NO_KERNEL');
      }

      let future = this.session.kernel.requestExecute(content, false);
      return future;
  }

  /**
   * Handle a change in the kernel by updating the document metadata.
   */
  private _onKernelChanged(sender: any, kernel: Kernel.IKernelConnection): void {
    if (!this.model || !kernel) {
      return;
    }
    //let parent = this;
    kernel.ready.then(() => {
      if (this.model) {
        this._updateLanguage(kernel.info.language_info);
      }

    });
    this._updateSpec(kernel);
  }

  /**
   * Update the kernel language.
   */
  private _updateLanguage(language: KernelMessage.ILanguageInfo): void {
    //this.model.metadata.set('language_info', language);
  }

  /**
   * Update the kernel spec.
   */
  private _updateSpec(kernel: Kernel.IKernelConnection): void {
    kernel.getSpec().then(spec => {
      if (this.isDisposed) {
        return;
      }
      //this.model.metadata.set('kernelspec', {
      //  name: kernel.name,
      //  display_name: spec.display_name,
      //  language: spec.language
      //});
    });
  }

  /**
   * Handle the dirty state of the model.
   */
  private _handleDirtyState(): void {
    if (!this.model) {
      return;
    }
    if (this.model.dirty) {
      this.title.className += ` ${DIRTY_CLASS}`;
    } else {
      this.title.className = this.title.className.replace(DIRTY_CLASS, '');
    }
  }

  private _context: DocumentRegistry.IContext<IHighChartsModel> = null;
  private _activated = new Signal<this, void>(this);
  private _contextChanged = new Signal<this, void>(this);
  private _ready = new PromiseDelegate<void>();
}


/**
 * A namespace for `HighChartsPanel` statics.
 */
export namespace HighChartsPanel {
  /**
   * An options interface for HighChartsPanels.
   */
  export
  interface IOptions {
    /**
     * The language preference for the model.
     */
    languagePreference?: string;

    /**
     * The content factory for the panel.
     */
    contentFactory?: IContentFactory;

  }

  /**
   * A content factory interface for HighChartsPanels.
   */
  export
  interface IContentFactory {
    /**
     * Create a new content area for the panel.
     */
    createHighCharts(options: HighCharts.IOptions): HighCharts;

  }

  /**
   * The default implementation of an `IContentFactory`.
   */
  export
  class ContentFactory implements IContentFactory {
    /**
     * Create a new content area for the panel.
     */
    createHighCharts(options: HighCharts.IOptions): HighCharts {
      return new HighCharts(options);
    }
  }

  /**
   * Default content factory for the HighCharts panel.
   */
  export
  const defaultContentFactory: ContentFactory = new ContentFactory();

  /* tslint:disable */
  /**
   * The HighCharts renderer token.
   */
  export
  const IContentFactory = new Token<IContentFactory>('jupyter.services.highcharts.content-factory');
  /* tslint:enable */
}
