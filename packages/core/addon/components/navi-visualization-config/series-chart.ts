/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * <NaviVisualizationConfig::SeriesChart
 *    @request={{this.request}}
 *    @response={{this.response}}
 *    @seriesConfig={{this.seriesConfig}}
 *    @seriesType={{this.seriesType}}
 *    @onUpdateConfig={{this.onUpdateConfig}}
 * />
 */
import { assign } from '@ember/polyfills';
import { A as arr } from '@ember/array';
import Component from '@glimmer/component';
import { set, get, computed, action } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { isArray } from '@ember/array';
import { copy } from 'ember-copy';
import { dataByDimensions } from 'navi-core/utils/data';
import { values, reject } from 'lodash-es';
import ColumnFragment from 'dummy/models/bard-request-v2/fragments/column';
import { getRequestDimensions } from 'navi-core/utils/chart-data';

export default class NaviVisualizationConfigSeriesChartComponent extends Component {
  @readOnly('args.request.metricColumns') metrics!: ColumnFragment[];

  @computed('args.seriesConfig.metric')
  get selectedMetric() {
    return this.metrics.find(({ cid }) => cid === this.args.seriesConfig.metric);
  }

  /**
   * whether to display the metric select
   */
  @computed('metrics', 'args.seriesType')
  get showMetricSelect() {
    const { metrics } = this;
    return this.args.seriesType === 'dimension' && isArray(metrics) && metrics.length > 1;
  }

  @computed('args.request')
  get dimensions() {
    return getRequestDimensions(this.args.request);
  }

  /**
   * response data grouped by dimension composite keys
   */
  @computed('args.{response,seriesConfig}')
  get dataByDimensions() {
    return dataByDimensions(this.args.response, this.dimensions);
  }

  /**
   * series objects grouped by dimension composite keys
   */
  @computed('dataByDimensions')
  get seriesByDimensions() {
    const { dimensions, dataByDimensions } = this;
    const keys = dataByDimensions.getKeys();
    const series = {};

    // Build a series object for each series key
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i],
        data = dataByDimensions.getDataForKey(key);

      /*
       * Build a search key by adding all dimension ids + descriptions
       * along with a collection of dimensions used by series
       */
      let searchKey = '',
        seriesDims = [],
        values = {},
        dimensionLabels = [];

      for (let dimIndex = 0; dimIndex < dimensions.length; dimIndex++) {
        // Pull dimension id + description from response data
        const dimension = dimensions[dimIndex];
        const value = data[0][dimension.canonicalName];
        searchKey += `${value} `;

        seriesDims.push({
          dimension,
          value
        });

        dimensionLabels.push(value);
        assign(values, { [dimension.cid]: value });
      }

      series[key] = {
        searchKey: searchKey.trim(),
        dimensions: seriesDims,
        config: {
          name: dimensionLabels.join(','),
          values
        }
      };
    }

    return series;
  }

  /**
   * all possible chart series data in the form:
   * [{searchKey: '...', dimensions: [{dimension: dimModel, value: {id: dimValueId, description: dimValDesc}}, ...]}, ...]
   */
  @computed('seriesByDimensions')
  get allSeriesData() {
    return values(this.seriesByDimensions);
  }

  /**
   * selected chart series data in the form:
   * [{searchKey: '...', dimensions: [{dimension: dimModel, value: {id: dimValueId, description: dimValDesc}}, ...]}, ...]
   */
  @computed('args.seriesConfig')
  get selectedSeriesData() {
    const { dimensions } = this;
    const selectedDimensions = get(this, 'args.seriesConfig.dimensions');

    let keys = arr(selectedDimensions)
      .mapBy('values')
      .map(value => dimensions.map(dimension => value[dimension.cid]).join('|'));
    return keys.map(key => this.seriesByDimensions[key]);
  }

  @action
  onAddSeries(series) {
    const newSeriesConfig = copy(this.args.seriesConfig);
    const { onUpdateConfig: handleUpdateConfig } = this.args;

    arr(newSeriesConfig.dimensions).pushObject(series.config);
    if (handleUpdateConfig) handleUpdateConfig(newSeriesConfig);
  }

  @action
  onRemoveSeries(series) {
    const seriesInConfig = this.args.seriesConfig?.dimensions;
    const newSeriesConfig = copy(this.args.seriesConfig);
    const { onUpdateConfig: handleUpdateConfig } = this;

    //remove series from config
    set(newSeriesConfig, 'dimensions', reject(seriesInConfig, series.config));
    if (handleUpdateConfig) handleUpdateConfig(newSeriesConfig);
  }

  @action
  onUpdateChartMetric(metric) {
    const newConfig = copy(this.args.seriesConfig);
    set(newConfig, `metric`, metric);
    this.onUpdateConfig(newConfig);
  }
}
