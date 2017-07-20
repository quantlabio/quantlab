// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Widget
} from '@phosphor/widgets';

/**
 * The class name added to a sheet widget.
 */
const SHEET_CLASS = 'jp-Sheet';

/**
 * A widget which manages a sheet session.
 */
export
class Sheet extends Widget {
  /**
   * Construct a new sheet widget.
   *
   * @param options - The sheet configuration options.
   */
  constructor(options: Sheet.IOptions = {}) {
    super();
    this.addClass(SHEET_CLASS);

  }

  /**
   * Dispose of the resources held by the sheet widget.
   */
  dispose(): void {
    super.dispose();
  }

}

/**
 * The namespace for `sheet` class statics.
 */
export
namespace Sheet {
  /**
   * Options for the sheet widget.
   */
  export
  interface IOptions {

  }
}