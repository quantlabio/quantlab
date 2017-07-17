// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Widget
} from '@phosphor/widgets';

/**
 * A widget which manages a calendar session.
 */
export
class Calendar extends Widget {
  /**
   * Construct a new calendar widget.
   *
   * @param options - The calendar configuration options.
   */
  constructor(options: Calendar.IOptions = {}) {
    super();
  }

  /**
   * Dispose of the resources held by the calendar widget.
   */
  dispose(): void {
    super.dispose();
  }
}

/**
 * The namespace for `Calendar` class statics.
 */
export
namespace Calendar {
  /**
   * Options for the calendar widget.
   */
  export
  interface IOptions {

  }
}
