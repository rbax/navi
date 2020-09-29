/**
 * Copyright 2018, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Mixin from '@ember/object/mixin';
import { get } from '@ember/object';
import { topN, maxDataByDimensions } from 'navi-core/utils/data';
import {
  METRIC_SERIES,
  DIMENSION_SERIES,
  DATE_TIME_SERIES,
  getRequestDimensions,
  buildDimensionSeriesValues,
  ChartType
} from 'navi-core/utils/chart-data';
import RequestFragment from 'navi-core/models/bard-request-v2/request';
import { ResponseV1 } from 'navi-data/serializers/facts/interface';

// TODO: Come back and remove this
// eslint-disable-next-line ember/no-new-mixins
export class ChartVizualization extends Mixin<any> {
  /**
   * Get a series builder based on type of chart
   *
   * @param type - type of chart series
   * @returns a series builder function
   */
  getSeriesBuilder(type: ChartType): Function {
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
  buildDimensionSeries(config: unknown, validations: unknown, request: RequestFragment, response: ResponseV1) {
    const metricPath = `${config}.metric`;
    const dimensionsPath = `${config}.dimensions`;
    const validationAttrs = get(validations, 'attrs');

    const isMetricValid = get(validationAttrs, `${metricPath}.isValid`);
    const areDimensionsValid = get(validationAttrs, `${dimensionsPath}.isValid`);

    const metric = isMetricValid
      ? request.metricColumns.find(({ cid }) => cid === get(this, metricPath))
      : request.metricColumns[0];

    let dimensionOrder = getRequestDimensions(request),
      responseRows = topN(
        maxDataByDimensions(response.rows, dimensionOrder, metric.canonicalName),
        metric.canonicalName,
        10
      ),
      dimensions = areDimensionsValid ? get(this, dimensionsPath) : buildDimensionSeriesValues(request, responseRows);

    return {
      type: DIMENSION_SERIES,
      config: {
        metric: metric.cid,
        dimensions
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
  buildMetricSeries(_config: unknown, _validations: unknown, _request: RequestFragment, _response: ResponseV1) {
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
  buildDateTimeSeries(_config: unknown, _validations: unknown, request: RequestFragment, _response: ResponseV1) {
    return {
      type: DATE_TIME_SERIES,
      config: {
        metric: request.metricColumns[0].cid,
        timeGrain: 'year'
      }
    };
  }
}

export default ChartVizualization.create();
