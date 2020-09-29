/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * <NaviVisualizationConfig::LineChart
 *    @request={{this.request}}
 *    @response={{this.response}}
 *    @options={{this.chartOptions}}
 *    @type={{this.visualizationType}}
 *    @onUpdateConfig={{this.onUpdateChartConfig}}
 * />
 */

import Component from '@glimmer/component';
import { set, computed, action } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { getOwner } from '@ember/application';

export default class NaviVisualizationConfigLineChartComponent extends Component {
  curveOptions = ['line', 'spline', 'step'];

  /**
   * @property {String} typePrefix - prefix for the line chart component
   */
  typePrefix = 'navi-visualization-config/chart-type/';

  /**
   * @property {Boolean} showStackOption - whether to display the `stacked` toggle
   */
  @computed('args.{request,type}')
  get showStackOption() {
    const { type, request } = this.args;
    const visualizationManifest = getOwner(this).lookup(`navi-visualization-manifest:${type}`);

    return visualizationManifest.hasGroupBy(request) || visualizationManifest.hasMultipleMetrics(request);
  }

  @readOnly('args.options.axis.y.series.config') seriesConfig!: unknown;

  @readOnly('args.options.axis.y.series.type') seriesType!: string;

  /**
   * Method to replace the seriesConfig in visualization config object.
   *
   * @method onUpdateConfig
   * @param {Object} seriesConfig
   */
  @action
  onUpdateSeriesConfig(seriesConfig) {
    const newOptions = { ...this.args.options };
    set(newOptions, 'axis.y.series.config', seriesConfig);
    this.args.onUpdateConfig(newOptions);
  }

  /**
   * Updates line chart style
   *
   * @method onUpdateStyle
   * @param {String} field - which setting is getting updated, currently `curve` and `area`
   * @param {String|Boolean} - value to update the setting with.
   */
  @action
  onUpdateStyle(field: string, value: string | boolean) {
    let newOptions = { ...this.args.options };
    newOptions.style = Object.assign({}, newOptions.style, { [field]: value });
    this.args.onUpdateConfig(newOptions);
  }
}
