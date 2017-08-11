// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Widget
} from '@phosphor/widgets';

export
interface IChartTools extends ChartTools {};

export
class ChartTools extends Widget {

  constructor() {
    super();
  }

  dispose(): void {
    super.dispose();
  }

}
