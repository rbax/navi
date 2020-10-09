/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import VisualizationBase from './visualization';
import { get } from '@ember/object';
import { METRIC_SERIES, DIMENSION_SERIES, DATE_TIME_SERIES, ChartType } from 'navi-core/utils/chart-data';
import RequestFragment from 'navi-core/models/bard-request-v2/request';
import { ResponseV1 } from 'navi-data/serializers/facts/interface';

export default class ChartVizualization extends VisualizationBase {
  /**
   * Get a series builder based on type of chart
   *
   * @param type - type of chart series
   * @returns a series builder function
   */
  getSeriesBuilder(type: ChartType) {
    let builders = {
      [METRIC_SERIES]: this.buildMetricSeries,
      [DIMENSION_SERIES]: this.buildDimensionSeries,
      [DATE_TIME_SERIES]: this.buildDateTimeSeries
    };

    return builders[type];
  }

  /**
   * Rebuild dimension series attributes based on request and response
   *
   * @param config - series config object
   * @param validations - validations object
   * @param request - request object
   * @param response - response object
   * @returns series config object
   */
  buildDimensionSeries(config: string, validations: unknown, request: RequestFragment, _response: ResponseV1) {
    const metricPath = `${config}.metric`;
    const dimensionsPath = `${config}.dimensions`;
    const validationAttrs = get(validations, 'attrs');

    const isMetricValid = get(validationAttrs, `${metricPath}.isValid`);

    const metricCid = get(this, metricPath);
    const metric =
      metricCid && isMetricValid
        ? request.metricColumns.find(({ cid }) => cid === metricCid)
        : request.metricColumns[0];

    return {
      type: DIMENSION_SERIES,
      config: {
        metric: metric.cid
      }
    };
  }

  /**
   * Rebuild metric series attributes based on request and response
   *
   * @param config - series config object
   * @param validations - validations object
   * @param request - request object
   * @param response - response object
   * @returns series config object
   */
  buildMetricSeries(_config: string, _validations: unknown, _request: RequestFragment, _response: ResponseV1) {
    return {
      type: METRIC_SERIES,
      config: {}
    };
  }

  /**
   * Rebuild date time series attributes based on request
   *
   * @param config - series config object
   * @param validations - validations object
   * @param request - request object
   * @param response - response object
   * @returns series config object
   */
  buildDateTimeSeries(_config: string, _validations: unknown, request: RequestFragment, _response: ResponseV1) {
    return {
      type: DATE_TIME_SERIES,
      config: {
        metric: request.metricColumns[0].cid,
        timeGrain: 'year'
      }
    };
  }
}
