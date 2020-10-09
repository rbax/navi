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
import { set, get, computed, action } from '@ember/object';
import { copy } from 'ember-copy';

export default class ChartSeriesConfigComponent extends Component {
  /**
   * @property {String} seriesConfigDataKey - object key of `seriesConfig` to read from and update when reordering
   */
  @computed('args.seriesType')
  get seriesConfigDataKey() {
    return this.args.seriesType === 'dimension' ? 'dimensions' : 'metrics';
  }

  /**
   * @property {Array} seriesData - array of series data in the form:
   * [{ metric: "adClicks", parameters: {} }, { ... }] for metrics or [{ name: "Dimension 1" }, { ... }] for dimensions
   */
  @computed('seriesConfigDataKey', 'args.seriesConfig')
  get seriesData() {
    return get(this, `args.seriesConfig.${get(this, 'seriesConfigDataKey')}`);
  }

  /**
   * @method onReorderSeries
   * @param {Array} series - new order of series
   */
  @action
  onReorderSeries(series) {
    const newSeriesConfig = copy(this.args.seriesConfig),
      seriesConfigDataKey = get(this, 'seriesConfigDataKey');

    // lowest item in stack should be first in order. Using `flex-flow: column-reverse` when rendering
    const reverseSeries = copy(series).reverse();

    set(newSeriesConfig, seriesConfigDataKey, reverseSeries);
    this.args.onUpdateConfig(newSeriesConfig);
  }
}
