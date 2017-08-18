// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  JSONValue, Token
} from '@phosphor/coreutils';

import {
  ConflatableMessage, Message
} from '@phosphor/messaging';

import {
  h, VirtualDOM, VirtualNode
} from '@phosphor/virtualdom';

import {
  PanelLayout, Widget
} from '@phosphor/widgets';

import {
  Styling
} from '@quantlab/apputils';

import {
  CodeEditor, JSONEditor
} from '@quantlab/codeeditor';

import {
  nbformat, ObservableJSON
} from '@quantlab/coreutils';

import {
  IChartTracker
} from './tracker';

export
interface IChartTools extends ChartTools {};


/**
 * The class name added to a CellTools instance.
 */
const CELLTOOLS_CLASS = 'jp-CellTools';

/**
 * The class name added to a CellTools tool.
 */
const CHILD_CLASS = 'jp-CellTools-tool';

/**
 * The class name added to an Editor instance.
 */
const EDITOR_CLASS = 'jp-MetadataEditorTool';

/**
 * The class name added to a KeySelector instance.
 */
const KEYSELECTOR_CLASS = 'jp-KeySelector';


/* tslint:disable */
/**
 * The main menu token.
 */
export
const IChartTools = new Token<IChartTools>('jupyter.services.chart-tools');
/* tslint:enable */


/**
 * The interface for cell metadata tools.
 */
export
interface IChartTools extends ChartTools {};


/**
 * A widget that provides cell metadata tools.
 */
export
class ChartTools extends Widget {
  /**
   * Construct a new CellTools object.
   */
  constructor(options: ChartTools.IOptions) {
    super();
    this.addClass(CELLTOOLS_CLASS);
    this.layout = new PanelLayout();
    this._tracker = options.tracker;

  }

  /**
   * Add a cell tool item.
   */
  addItem(options: ChartTools.IAddOptions): void {
    let tool = options.tool;
    let rank = 'rank' in options ? options.rank : 100;
    let rankItem = { tool, rank };
    let index = ArrayExt.upperBound(this._items, rankItem, Private.itemCmp);

    tool.addClass(CHILD_CLASS);

    // Add the tool.
    ArrayExt.insert(this._items, index, rankItem);
    let layout = this.layout as PanelLayout;
    layout.insertWidget(index, tool);

    // Trigger the tool to update its active cell.
    //MessageLoop.sendMessage(tool, ChartTools.ActiveCellMessage);
  }

  /**
   * Handle the removal of a child
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    let index = ArrayExt.findFirstIndex(this._items, item => item.tool === msg.child);
    if (index !== -1) {
      ArrayExt.removeAt(this._items, index);
    }
  }

  private _items: Private.IRankItem[] = [];
  private _tracker: IChartTracker;
  //private _prevActive: ICellModel | null;
}

/**
 * The namespace for ChartTools class statics.
 */
export
namespace ChartTools {
  /**
   * The options used to create a CellTools object.
   */
  export
  interface IOptions {
    /**
     * The chart tracker used by the sheet tools.
     */
    tracker: IChartTracker;
  }

  /**
   * The options used to add an item to the cell tools.
   */
  export
  interface IAddOptions {
    /**
     * The tool to add to the cell tools area.
     */
    tool: Tool;

    /**
     * The rank order of the widget among its siblings.
     */
    rank?: number;
  }

  /**
   * A singleton conflatable `'selection-changed'` message.
   */
  export
  const SelectionMessage = new ConflatableMessage('chart-selection-changed');

  /**
   * The base cell tool, meant to be subclassed.
   */
  export
  class Tool extends Widget {
    /**
     * The cell tools object.
     */
    readonly parent: IChartTools;

    /**
     * Process a message sent to the widget.
     *
     * @param msg - The message sent to the widget.
     */
    processMessage(msg: Message): void {
      super.processMessage(msg);
      switch (msg.type) {
      case 'activecell-changed':
        //this.onActiveCellChanged(msg);
        break;
      case 'selection-changed':
        //this.onSelectionChanged(msg);
        break;
      case 'jsonvalue-changed':
        //this.onMetadataChanged(msg as ObservableJSON.ChangeMessage);
        break;
      default:
        break;
      }
    }

    /**
     * Handle a change to the selection.
     *
     * #### Notes
     * The default implementation is a no-op.
     */
    protected onSelectionChanged(msg: Message): void { /* no-op */ }

    /**
     * Handle a change to the metadata of the active cell.
     *
     * #### Notes
     * The default implementation is a no-op.
     */
     protected onMetadataChanged(msg: ObservableJSON.ChangeMessage): void { /* no-op */ }
  }

  /**
   * A raw metadata editor.
   */
  export
  class MetadataEditorTool extends Tool {
    /**
     * Construct a new raw metadata tool.
     */
    constructor(options: MetadataEditorTool.IOptions) {
      super();
      let editorFactory = options.editorFactory;
      this.addClass(EDITOR_CLASS);
      let layout = this.layout = new PanelLayout();
      this.editor = new JSONEditor({
        editorFactory,
        title: 'Edit Metadata',
        collapsible: true
      });
      layout.addWidget(this.editor);
    }

    /**
     * The editor used by the tool.
     */
    readonly editor: JSONEditor;


  }

  /**
   * The namespace for `MetadataEditorTool` static data.
   */
  export
  namespace MetadataEditorTool {
    /**
     * The options used to initialize a metadata editor tool.
     */
    export
    interface IOptions {
      /**
       * The editor factory used by the tool.
       */
      editorFactory: CodeEditor.Factory;
    }
  }

  /**
   * A cell tool that provides a selection for a given metadata key.
   */
  export
  class KeySelector extends Tool {
    /**
     * Construct a new KeySelector.
     */
    constructor(options: KeySelector.IOptions) {
      super({ node: Private.createSelectorNode(options) });
      this.addClass(KEYSELECTOR_CLASS);
      this.key = options.key;
      this._validCellTypes = options.validCellTypes || [];

    }

    /**
     * The metadata key used by the selector.
     */
    readonly key: string;

    /**
     * The select node for the widget.
     */
    get selectNode(): HTMLSelectElement {
      return this.node.getElementsByTagName('select')[0] as HTMLSelectElement;
    }

    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the notebook panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event: Event): void {
      switch (event.type) {
        case 'change':
          //this.onValueChanged();
          break;
        default:
          break;
      }
    }

    /**
     * Handle `after-attach` messages for the widget.
     */
    protected onAfterAttach(msg: Message): void {
      let node = this.selectNode;
      node.addEventListener('change', this);
    }

    /**
     * Handle `before-detach` messages for the widget.
     */
    protected onBeforeDetach(msg: Message): void {
      let node = this.selectNode;
      node.removeEventListener('change', this);
    }



    private _validCellTypes: string[];

  }

  /**
   * The namespace for `KeySelector` static data.
   */
  export
  namespace KeySelector {
    /**
     * The options used to initialize a keyselector.
     */
    export
    interface IOptions {
      /**
       * The metadata key of interest.
       */
      key: string;

      /**
       * The map of options to values.
       */
      optionsMap: { [key: string]: JSONValue };

      /**
       * The optional title of the selector - defaults to capitalized `key`.
       */
      title?: string;

      /**
       * The optional valid cell types - defaults to all valid types.
       */
      validCellTypes?: nbformat.CellType[];


    }
  }

  /**
   * Create a slideshow selector.
   */
  export
  function createCategorySelector(): KeySelector {
    let options: KeySelector.IOptions = {
      key: 'category',
      title: 'Category',
      optionsMap: {
        'Chart': 'chart',
        'Stock': 'stock',
        'Map': 'map'
      }
    };
    return new KeySelector(options);
  }

  /**
   * Create an nbcovert selector.
   */
  export
  function createNBConvertSelector(): KeySelector {
    return new KeySelector({
      key: 'raw_mimetype',
      title: 'Type',
      optionsMap: {
        '-': '-',
        'LaTeX': 'text/latex',
        'reST': 'text/restructuredtext',
        'HTML': 'text/html',
        'Markdown': 'text/markdown',
        'Python': 'text/x-python'
      },
      validCellTypes: ['raw']
    });
  }

}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * An object which holds a widget and its sort rank.
   */
  export
  interface IRankItem {
    /**
     * The widget for the item.
     */
    tool: ChartTools.Tool;

    /**
     * The sort rank of the menu.
     */
    rank: number;
  }

  /**
   * A comparator function for widget rank items.
   */
  export
  function itemCmp(first: IRankItem, second: IRankItem): number {
    return first.rank - second.rank;
  }

  /**
   * Create the node for a KeySelector.
   */
  export
  function createSelectorNode(options: ChartTools.KeySelector.IOptions): HTMLElement {
    let name = options.key;
    let title = (
      options.title || name[0].toLocaleUpperCase() + name.slice(1)
    );
    let optionNodes: VirtualNode[] = [];
    for (let label in options.optionsMap) {
      let value = JSON.stringify(options.optionsMap[label]);
      optionNodes.push(h.option({ label, value }));
    }
    let node = VirtualDOM.realize(
      h.div({},
        h.label(title),
        h.select({}, optionNodes))
    );
    Styling.styleNode(node);
    return node;
  }
}
