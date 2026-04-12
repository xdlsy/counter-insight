// static/js/chart.js

// ECharts cream theme configuration
const darkTheme = {
    color: [
        '#8b6f47', '#a67c52', '#b5651d', '#c17a54',
        '#7a6b4e', '#9a8567', '#c9a86c', '#b8956a',
        '#a67c39', '#c9a060', '#b88050', '#c9956a'
    ],
    backgroundColor: 'transparent',
    textStyle: {
        fontFamily: 'Noto Sans SC, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    title: {
        textStyle: {
            color: '#3d3630',
            fontWeight: 600
        },
        subtextStyle: {
            color: '#6b635a'
        }
    },
    legend: {
        textStyle: {
            color: '#6b635a',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11
        },
        pageTextStyle: {
            color: '#6b635a'
        }
    },
    tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#d4ccc0',
        borderWidth: 1,
        textStyle: {
            color: '#3d3630',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12
        }
    },
    toolbox: {
        iconStyle: {
            borderColor: '#6b635a'
        },
        emphasis: {
            iconStyle: {
                borderColor: '#8b6f47'
            }
        }
    },
    dataZoom: {
        backgroundColor: '#e0d8cc',
        borderColor: '#d4ccc0',
        fillerColor: 'rgba(139, 111, 71, 0.1)',
        handleColor: '#8b6f47',
        handleSize: '100%',
        textStyle: {
            color: '#6b635a'
        }
    },
    xAxis: {
        axisLine: {
            lineStyle: {
                color: '#d4ccc0'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#d4ccc0'
            }
        },
        axisLabel: {
            color: '#6b635a',
            fontFamily: 'JetBrains Mono, monospace'
        },
        splitLine: {
            lineStyle: {
                color: '#e0d8cc',
                type: 'dashed'
            }
        }
    },
    yAxis: {
        axisLine: {
            lineStyle: {
                color: '#d4ccc0'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#d4ccc0'
            }
        },
        axisLabel: {
            color: '#6b635a',
            fontFamily: 'JetBrains Mono, monospace'
        },
        splitLine: {
            lineStyle: {
                color: '#e0d8cc',
                type: 'dashed'
            }
        }
    },
    categoryAxis: {
        axisLine: {
            lineStyle: {
                color: '#d4ccc0'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#d4ccc0'
            }
        },
        axisLabel: {
            color: '#6b635a'
        },
        splitLine: {
            lineStyle: {
                color: '#e0d8cc',
                type: 'dashed'
            }
        }
    },
    line: {
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
            width: 2
        },
        emphasis: {
            lineStyle: {
                width: 3
            }
        }
    },
    graph: {
        color: [
            '#8b6f47', '#a67c52', '#b5651d', '#c17a54',
            '#7a6b4e', '#9a8567', '#c9a86c', '#b8956a'
        ]
    }
};

class ChartManager {
    constructor(domId) {
        this.chart = echarts.init(document.getElementById(domId));
        this.option = {};
        this.chart.setTheme(darkTheme);
    }

    update(data) {
        const { timePoints, series } = data;

        // Check if there's data
        if (!timePoints || timePoints.length === 0 || Object.keys(series).length === 0) {
            this.chart.setOption({
                title: {
                    text: '暂无数据',
                    subtext: '请先上传日志文件',
                    left: 'center',
                    top: 'center',
                    textStyle: {
                        color: '#9a928a',
                        fontSize: 18
                    },
                    subtextStyle: {
                        color: '#9a928a',
                        fontSize: 14
                    }
                },
                series: []
            });
            return;
        }

        const seriesData = Object.keys(series).map(key => ({
            name: key,
            type: 'line',
            data: series[key],
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            showSymbol: false,
            lineStyle: {
                width: 2,
                shadowColor: 'rgba(139, 111, 71, 0.3)',
                shadowBlur: 4
            },
            emphasis: {
                focus: 'series',
                lineStyle: {
                    width: 3
                }
            },
            animationDuration: 1000,
            animationEasing: 'cubicOut'
        }));

        this.option = {
            title: {
                text: '日志计数趋势图',
                left: 'center',
                top: 10,
                textStyle: {
                    color: '#3d3630'
                }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#d4ccc0',
                borderWidth: 1,
                textStyle: {
                    color: '#3d3630',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12
                },
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#b8aea0'
                    },
                    lineStyle: {
                        color: '#b8aea0'
                    }
                },
                formatter: function(params) {
                    let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
                    params.forEach(p => {
                        const color = p.color;
                        result += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>`;
                        result += `${p.seriesName}: <span style="font-weight:600;color:${color}">${p.value}</span><br/>`;
                    });
                    return result;
                }
            },
            legend: {
                type: 'scroll',
                orient: 'horizontal',
                bottom: 10,
                textStyle: {
                    color: '#6b635a',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11
                },
                pageTextStyle: {
                    color: '#6b635a'
                },
                data: Object.keys(series)
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '18%',
                top: '15%',
                containLabel: true
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: '缩放',
                            back: '还原'
                        }
                    },
                    restore: {
                        title: '还原'
                    },
                    saveAsImage: {
                        title: '保存图片'
                    }
                },
                iconStyle: {
                    borderColor: '#6b635a'
                },
                emphasis: {
                    iconStyle: {
                        borderColor: '#8b6f47'
                    }
                },
                right: 20
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
                    end: 100,
                    height: 20,
                    bottom: 60,
                    borderColor: '#d4ccc0',
                    backgroundColor: '#e0d8cc',
                    fillerColor: 'rgba(139, 111, 71, 0.15)',
                    handleStyle: {
                        color: '#8b6f47'
                    },
                    textStyle: {
                        color: '#6b635a'
                    }
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: timePoints,
                axisLine: {
                    lineStyle: {
                        color: '#d4ccc0'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#d4ccc0'
                    }
                },
                axisLabel: {
                    color: '#6b635a',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    rotate: 30,
                    margin: 12
                }
            },
            yAxis: {
                type: 'value',
                name: '计数',
                nameTextStyle: {
                    color: '#6b635a',
                    padding: [0, 0, 0, 40]
                },
                axisLine: {
                    lineStyle: {
                        color: '#d4ccc0'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#d4ccc0'
                    }
                },
                axisLabel: {
                    color: '#6b635a',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: {
                        color: '#e0d8cc',
                        type: 'dashed'
                    }
                }
            },
            series: seriesData,
            animationDuration: 1000,
            animationEasing: 'cubicOut'
        };

        this.chart.setOption(this.option, true);
    }

    resize() {
        this.chart.resize();
    }
}