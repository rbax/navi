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

export default class NaviVisualizationConfigSeriesChartComponent extends Component {
  /**
   * @property {Array} metrics
   */
  @readOnly('args.request.metricColumns') metrics;

  /**
   * @property {Object} selectedMetric
   */
  @computed('args.seriesConfig.metric')
  get selectedMetric() {
    return this.metrics.find(({ cid }) => cid === this.args.seriesConfig.metric);
  }

  /**
   * @property {Boolean} showMetricSelect - whether to display the metric select
   */
  @computed('metrics', 'args.seriesType')
  get showMetricSelect() {
    const { metrics } = this;
    return this.args.seriesType === 'dimension' && isArray(metrics) && metrics.length > 1;
  }

  /**
   * @property {Array} dimensions
   */
  @computed('args.request')
  get dimensions() {
    return this.args.request.columns
      .filter(c => c.type === 'dimension' || (c.type === 'timeDimension' && c.field !== 'dateTime'))
      .map(c => c.columnMetadata);
  }

  /**
   * @property {DataGroup} dataByDimensions - response data grouped by dimension composite keys
   */
  @computed('args.{response,seriesConfig}')
  get dataByDimensions() {
    return dataByDimensions(this.args.response, this.args.seriesConfig.dimensionOrder);
  }

  /**
   * @property {Object} seriesByDimensions - series objects grouped by dimension composite keys
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
        let dimension = dimensions[dimIndex],
          id = get(data, `0.${dimension.name}|id`),
          description = get(data, `0.${dimension.name}|desc`);

        searchKey += `${id} ${description} `;

        seriesDims.push({
          dimension,
          value: {
            id,
            description
          }
        });

        dimensionLabels.push(description || id);
        assign(values, { [dimension.name]: id });
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
   * @property {Array} allSeriesData - all possible chart series data in the form:
   * [{searchKey: '...', dimensions: [{dimension: dimModel, value: {id: dimValueId, description: dimValDesc}}, ...]}, ...]
   */
  @computed('seriesByDimensions')
  get allSeriesData() {
    return values(this.seriesByDimensions);
  }

  /**
   * @property {Array} selectedSeriesData - selected chart series data in the form:
   * [{searchKey: '...', dimensions: [{dimension: dimModel, value: {id: dimValueId, description: dimValDesc}}, ...]}, ...]
   */
  @computed('args.seriesConfig')
  get selectedSeriesData() {
    let dimensionOrder = get(this, 'args.seriesConfig.dimensionOrder'),
      selectedDimensions = get(this, 'args.seriesConfig.dimensions');

    let keys = arr(selectedDimensions)
      .mapBy('values')
      .map(value => dimensionOrder.map(dimension => value[dimension]).join('|'));
    return keys.map(key => get(this, 'seriesByDimensions')[key]);
  }

  /**
   * @method onAddSeries
   * @param {Object} series
   */
  @action
  onAddSeries(series) {
    const newSeriesConfig = copy(this.seriesConfig);
    const { onUpdateConfig: handleUpdateConfig } = this.args;

    arr(newSeriesConfig.dimensions).pushObject(series.config);
    if (handleUpdateConfig) handleUpdateConfig(newSeriesConfig);
  }

  /**
   * @method onRemoveSeries
   * @param {Object} series
   */
  @action
  onRemoveSeries(series) {
    const seriesInConfig = this.args.seriesConfig?.dimensions;
    const newSeriesConfig = copy(this.args.seriesConfig);
    const { onUpdateConfig: handleUpdateConfig } = this;

    //remove series from config
    set(newSeriesConfig, 'dimensions', reject(seriesInConfig, series.config));
    if (handleUpdateConfig) handleUpdateConfig(newSeriesConfig);
  }

  /**
   * @method onUpdateChartMetric
   * @param {Object} metric
   */
  @action
  onUpdateChartMetric(metric) {
    const newConfig = copy(this.seriesConfig);
    set(newConfig, `metric`, metric);
    this.onUpdateConfig(newConfig);
  }
}
