/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Mixin from '@ember/object/mixin';
import EmberObject from '@ember/object';
import { ResponseV1 } from 'navi-data/serializers/facts/interface';
import RequestFragment from 'navi-core/models/bard-request-v2/request';
import { SeriesConfig } from 'navi-core/models/line-chart';

type ResponseRow = ResponseV1['rows'][number];
export type C3Row = Record<string, number | null | undefined> & {
  x: {
    rawValue: string;
    displayValue: string;
  };
};

declare const r: C3Row;
export default abstract class BaseChartBuilder extends EmberObject {
  /**
   * @param row - single row of fact data
   * @returns name of x value given row belongs to
   */
  abstract getXValue(row: ResponseRow, config: SeriesConfig, request: RequestFragment): string | number;

  /**
   * @param response - response from fact service
   * @param config
   * @param config.metrics - list of metrics to chart
   * @param request - request used to get data
   * @returns array of c3 data with x values
   */
  abstract buildData(response: ResponseV1, _config: SeriesConfig, request: RequestFragment): C3Row[];

  /**
   * @returns layout for tooltip
   */
  abstract buildTooltip(
    _config: unknown,
    _request: RequestFragment
  ): Mixin<{ layout: unknown; rowData: unknown }, EmberObject>;
}
