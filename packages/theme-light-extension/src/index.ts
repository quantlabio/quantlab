import {
  QuantLabPlugin
} from '@quantlab/application';

import '@quantlab/theming/style/variables-light.css';

/**
 * Initialization data for the light theme extension.
 */
const extension: QuantLabPlugin<void> = {
  id: 'jupyter.themes.light',
  autoStart: true,
  activate: (app) => {
    // No-op.
  }
};

export default extension;
