/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { readOnly } from '@ember/object/computed';
import { set, get, computed } from '@ember/object';
import { attr } from '@ember-data/model';
import ChartVisualization from './chart-visualization';
import { validator, buildValidations } from 'ember-cp-validations';
import { METRIC_SERIES, DIMENSION_SERIES, DATE_TIME_SERIES, chartTypeForRequest } from 'navi-core/utils/chart-data';
import RequestFragment from './bard-request-v2/request';
import { ResponseV1 } from 'navi-data/serializers/facts/interface';

const SERIES_PATH = 'metadata.axis.y.series';
const CONFIG_PATH = `${SERIES_PATH}.config`;

/**
 * @constant {Object} Validations - Validation object
 */
const Validations = buildValidations(
  {
    //Global Validation
    [`${SERIES_PATH}.type`]: validator('chart-type'),

    //Metric Series Validation
    [`${CONFIG_PATH}.metrics`]: validator('request-metrics', {
      disabled: computed('chartType', function() {
        return this.chartType !== METRIC_SERIES;
      }),
      dependentKeys: ['model._request.columns.[]']
    }),

    [`${CONFIG_PATH}.timeGrain`]: validator('request-time-grain', {
      disabled: computed('chartType', function() {
        return this.chartType !== DATE_TIME_SERIES;
      }),
      dependentKeys: ['model._request.filters.[]']
    }),

    //Dimension Series Validations
    [`${CONFIG_PATH}.metric`]: validator('request-metric-exist', {
      disabled: computed('chartType', function() {
        return this.chartType !== DIMENSION_SERIES && this.chartType !== DATE_TIME_SERIES;
      }),
      dependentKeys: ['model._request.columns.[]']
    }),

    [`${CONFIG_PATH}.dimensions`]: [
      validator(
        'length',
        { min: 1 },
        {
          disabled: computed('chartType', function() {
            return this.chartType !== DIMENSION_SERIES;
          }),
          dependentKeys: ['model._request.columns.[]']
        }
      ),
      validator('request-filters', {
        disabled: computed('chartType', function() {
          return this.chartType !== DIMENSION_SERIES;
        }),
        dependentKeys: ['model._request.filters.@each.values']
      })
    ]
  },
  {
    //Global Validation Options
    chartType: computed('model._request.{dimensions.[],metrics.[],intervals.firstObject.interval}', function() {
      let request = get(this, 'request');
      return request && chartTypeForRequest(request);
    }),
    request: readOnly('model._request')
  }
);

export default class LineChartVisualization extends ChartVisualization.extend(Validations) {
  @attr('string', { defaultValue: 'line-chart' })
  type!: string;
  @attr('number', { defaultValue: 1 })
  version!: number;
  @attr({
    defaultValue: () => {
      return { axis: { y: { series: { type: null, config: {} } } } };
    }
  })
  metadata!: unknown;

  /**
   * Rebuild config based on request and response
   *
   * @method rebuildConfig
   * @param {MF.Fragment} request - request model fragment
   * @param {Object} response - response object
   * @return {Object} this object
   */
  rebuildConfig(request: RequestFragment, response: ResponseV1) {
    this.isValidForRequest(request);

    const chartType = chartTypeForRequest(request);
    const seriesBuilder = this.getSeriesBuilder(chartType).bind(this);
    const series = seriesBuilder(CONFIG_PATH, this.validations, request, response);
    const style = this.getWithDefault('metadata.style', {});

    set(this, 'metadata', {
      style,
      axis: {
        y: { series }
      }
    });
    return this;
  }
}
