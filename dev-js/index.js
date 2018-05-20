import HighchartApp from './highchart-app.js';
var chartConfigs = [require('../chart-configs/generation-config.js').default, require('../chart-configs/decomposition-config.js').default];
console.log(HighchartApp, chartConfigs);

HighchartApp.chartController.init(chartConfigs);