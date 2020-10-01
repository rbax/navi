/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Usage:
 *   <ChartSeriesConfig
 *     @seriesType={{this.seriesType}}
 *     @seriesConfig={{this.seriesConfig}}
 *     @onUpdateConfig={{this.onUpdateConfig}}
 *   />
 */
import Component from '@glimmer/component';
import { computed, action } from '@ember/object';

export default class ChartSeriesConfigComponent extends Component {
  /**
   * object key of `seriesConfig` to read from and update when reordering
   */
  get seriesConfigDataKey() {
    return this.args.seriesType === 'dimension' ? 'dimensions' : 'metrics';
  }

  /**
   * array of series data in the form:
   * [{ metric: "adClicks", parameters: {} }, { ... }] for metrics or [{ name: "Dimension 1" }, { ... }] for dimensions
   */
  @computed('seriesConfigDataKey', 'args.seriesConfig')
  get seriesData() {
    return this.args.seriesConfig[this.seriesConfigDataKey];
  }

  /**
   * @param series - new order of series
   */
  @action
  onReorderSeries(series: unknown[]) {
    const { seriesConfigDataKey } = this;
    const newSeriesConfig = { ...this.args.seriesConfig };

    // lowest item in stack should be first in order. Using `flex-flow: column-reverse` when rendering
    const reverseSeries = [...series].reverse();

    newSeriesConfig[seriesConfigDataKey] = reverseSeries;
    this.args.onUpdateConfig(newSeriesConfig);
  }
}
