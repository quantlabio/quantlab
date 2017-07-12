// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  CommandLinker
} from '@quantlab/apputils';

import {
  Base64ModelFactory, DocumentRegistry, TextModelFactory
} from '@quantlab/docregistry';

import {
  IRenderMime, RenderMime, defaultRendererFactories
} from '@quantlab/rendermime';

import {
  Application, IPlugin
} from '@phosphor/application';

import {
  createRendermimePlugins
} from './mimerenderers';

import {
  ApplicationShell
} from './shell';

export { ApplicationShell } from './shell';
export { ILayoutRestorer, LayoutRestorer } from './layoutrestorer';

import '../style/index.css';

/**
 * The type for all QuantLab plugins.
 */
export
type QuantLabPlugin<T> = IPlugin<QuantLab, T>;


/**
 * QuantLab is the main application class. It is instantiated once and shared.
 */
export
class QuantLab extends Application<ApplicationShell> {
  /**
   * Construct a new QuantLab object.
   */
  constructor(options: QuantLab.IOptions = {}) {
    super({ shell: new ApplicationShell() });
    this._info = {
      name: options.name || 'QuantLab',
      namespace: options.namespace || 'quantlab',
      version:  options.version || 'unknown',
      devMode: options.devMode || false,
      settingsDir: options.settingsDir || '',
      assetsDir: options.assetsDir || ''
    };
    if (options.devMode) {
      this.shell.addClass('jp-mod-devMode');
    }
    let linker = new CommandLinker({ commands: this.commands });
    this.commandLinker = linker;

    let linkHandler = {
      handleLink: (node: HTMLElement, path: string) => {
        linker.connectNode(node, 'docmanager:open', { path });
      }
    };
    let initialFactories = defaultRendererFactories;
    this.rendermime = new RenderMime({ initialFactories, linkHandler });

    let registry = this.docRegistry = new DocumentRegistry();
    registry.addModelFactory(new TextModelFactory());
    registry.addModelFactory(new Base64ModelFactory());
    registry.addFileType({
      name: 'Text',
      extension: '.txt',
      contentType: 'file',
      fileFormat: 'text'
    });
    registry.addCreator({ name: 'Text File', fileType: 'Text', });

    if (options.mimeExtensions) {
      let plugins = createRendermimePlugins(options.mimeExtensions);
      plugins.forEach(plugin => { this.registerPlugin(plugin); });
    }
  }

  /**
   * The document registry instance used by the application.
   */
  readonly docRegistry: DocumentRegistry;

  /**
   * The rendermime instance used by the application.
   */
  readonly rendermime: RenderMime;

  /**
   * The command linker used by the application.
   */
  readonly commandLinker: CommandLinker;

  /**
   * The information about the application.
   */
  get info(): QuantLab.IInfo {
    return this._info;
  }

  /**
   * Promise that resolves when state is first restored, returning layout description.
   *
   * #### Notes
   * This is just a reference to `shell.restored`.
   */
  get restored(): Promise<ApplicationShell.ILayout> {
    return this.shell.restored;
  }

  /**
   * Register plugins from a plugin module.
   *
   * @param mod - The plugin module to register.
   */
  registerPluginModule(mod: QuantLab.IPluginModule): void {
    let data = mod.default;
    // Handle commonjs exports.
    if (!mod.hasOwnProperty('__esModule')) {
      data = mod as any;
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    data.forEach(item => { this.registerPlugin(item); });
  }

  /**
   * Register the plugins from multiple plugin modules.
   *
   * @param mods - The plugin modules to register.
   */
  registerPluginModules(mods: QuantLab.IPluginModule[]): void {
    mods.forEach(mod => { this.registerPluginModule(mod); });
  }

  private _info: QuantLab.IInfo;
}


/**
 * The namespace for `QuantLab` class statics.
 */
export
namespace QuantLab {
  /**
   * The options used to initialize a QuantLab object.
   */
  export
  interface IOptions {
    /**
     * The name of the QuantLab application.
     */
    name?: string;

    /**
     * The namespace/prefix plugins may use to denote their origin.
     *
     * #### Notes
     * This field may be used by persistent storage mechanisms such as state
     * databases, cookies, session storage, etc.
     *
     * If unspecified, the default value is `'quantlab'`.
     */
    namespace?: string;

    /**
     * The version of the QuantLab application.
     */
    version?: string;

    /**
     * Whether the application is in dev mode.
     */
    devMode?: boolean;

    /**
     * The settings directory of the app on the server.
     */
    settingsDir?: string;

    /**
     * The assets directory of the app on the server.
     */
    assetsDir?: string;

    /**
     * The mime renderer extensions.
     */
    mimeExtensions?: IRenderMime.IExtensionModule[];
  }

  /**
   * The information about a QuantLab application.
   */
  export
  interface IInfo {
    /**
     * The name of the QuantLab application.
     */
    readonly name: string;

    /**
     * The namespace/prefix plugins may use to denote their origin.
     */
    readonly namespace: string;

    /**
     * The version of the QuantLab application.
     */
    readonly version: string;

    /**
     * Whether the application is in dev mode.
     */
    readonly devMode: boolean;

    /**
     * The settings directory of the app on the server.
     */
    readonly settingsDir: string;

    /**
     * The assets directory of the app on the server.
     */
    readonly assetsDir: string;
  }

  /**
   * The interface for a module that exports a plugin or plugins as
   * the default value.
   */
  export
  interface IPluginModule {
    /**
     * The default export.
     */
    default: QuantLabPlugin<any> | QuantLabPlugin<any>[];
  }
}
