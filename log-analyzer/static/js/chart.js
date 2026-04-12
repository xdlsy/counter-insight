// static/js/chart.js

class ChartManager {
    constructor(domId) {
        this.chart = echarts.init(document.getElementById(domId));
        this.option = {};
    }

    update(data) {
        const { timePoints, series } = data;

        const seriesData = Object.keys(series).map(key => ({
            name: key,
            type: 'line',
            data: series[key],
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
        }));

        this.option = {
            title: {
                text: '日志计数趋势图',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    let result = params[0].axisValue + '<br/>';
                    params.forEach(p => {
                        result += `${p.seriesName}: ${p.value}<br/>`;
                    });
                    return result;
                }
            },
            legend: {
                type: 'scroll',
                bottom: 10,
                data: Object.keys(series)
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: timePoints,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value'
            },
            series: seriesData
        };

        this.chart.setOption(this.option);
    }

    resize() {
        this.chart.resize();
    }
}