import {
  QuantLabPlugin
} from '@quantlab/application';


import '@quantlab/theming/style/variables-dark.css';


/**
 * Initialization data for the dark theme extension.
 */
const extension: QuantLabPlugin<void> = {
  id: 'jupyter.themes.dark',
  autoStart: true,
  activate: (app) => {
    // No-op
  }
};

export default extension;
