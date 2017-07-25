// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
 
import {
  IServiceManager, ServiceManager
} from '@quantlab/services';

import {
  QuantLabPlugin
} from '@quantlab/application';


/**
 * The default services provider.
 */
const plugin: QuantLabPlugin<IServiceManager> = {
  id: 'jupyter.services.services',
  provides: IServiceManager,
  activate: (): IServiceManager => new ServiceManager()
};


/**
 * Export the plugin as default.
 */
export default plugin;
