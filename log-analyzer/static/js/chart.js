// static/js/chart.js

// ECharts warm theme configuration
const darkTheme = {
    color: [
        '#e8a648', '#d4763a', '#e87b5e', '#c45c3a',
        '#d4a84b', '#f0b88a', '#8b6f47', '#b8956a',
        '#c97850', '#ddaa70', '#e69060', '#c07858'
    ],
    backgroundColor: 'transparent',
    textStyle: {
        fontFamily: 'Noto Sans SC, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    title: {
        textStyle: {
            color: '#f5ebe0',
            fontWeight: 600
        },
        subtextStyle: {
            color: '#b8a88a'
        }
    },
    legend: {
        textStyle: {
            color: '#b8a88a',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11
        },
        pageTextStyle: {
            color: '#b8a88a'
        }
    },
    tooltip: {
        backgroundColor: 'rgba(42, 33, 28, 0.95)',
        borderColor: '#4a3d30',
        borderWidth: 1,
        textStyle: {
            color: '#f5ebe0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12
        }
    },
    toolbox: {
        iconStyle: {
            borderColor: '#b8a88a'
        },
        emphasis: {
            iconStyle: {
                borderColor: '#e8a648'
            }
        }
    },
    dataZoom: {
        backgroundColor: '#322822',
        borderColor: '#4a3d30',
        fillerColor: 'rgba(232, 166, 72, 0.1)',
        handleColor: '#e8a648',
        handleSize: '100%',
        textStyle: {
            color: '#b8a88a'
        }
    },
    xAxis: {
        axisLine: {
            lineStyle: {
                color: '#4a3d30'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#4a3d30'
            }
        },
        axisLabel: {
            color: '#b8a88a',
            fontFamily: 'JetBrains Mono, monospace'
        },
        splitLine: {
            lineStyle: {
                color: '#322822',
                type: 'dashed'
            }
        }
    },
    yAxis: {
        axisLine: {
            lineStyle: {
                color: '#4a3d30'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#4a3d30'
            }
        },
        axisLabel: {
            color: '#b8a88a',
            fontFamily: 'JetBrains Mono, monospace'
        },
        splitLine: {
            lineStyle: {
                color: '#322822',
                type: 'dashed'
            }
        }
    },
    categoryAxis: {
        axisLine: {
            lineStyle: {
                color: '#4a3d30'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#4a3d30'
            }
        },
        axisLabel: {
            color: '#b8a88a'
        },
        splitLine: {
            lineStyle: {
                color: '#322822',
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
            '#e8a648', '#d4763a', '#e87b5e', '#c45c3a',
            '#d4a84b', '#f0b88a', '#8b6f47', '#b8956a'
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
                        color: '#7a6a56',
                        fontSize: 18
                    },
                    subtextStyle: {
                        color: '#7a6a56',
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
                shadowColor: 'rgba(232, 166, 72, 0.3)',
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
                top: 10
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(42, 33, 28, 0.95)',
                borderColor: '#4a3d30',
                borderWidth: 1,
                textStyle: {
                    color: '#f5ebe0',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12
                },
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#6b5545'
                    },
                    lineStyle: {
                        color: '#6b5545'
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
                    color: '#b8a88a',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11
                },
                pageTextStyle: {
                    color: '#b8a88a'
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
                    borderColor: '#b8a88a'
                },
                emphasis: {
                    iconStyle: {
                        borderColor: '#e8a648'
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
                    borderColor: '#4a3d30',
                    backgroundColor: '#322822',
                    fillerColor: 'rgba(232, 166, 72, 0.15)',
                    handleStyle: {
                        color: '#e8a648'
                    },
                    textStyle: {
                        color: '#b8a88a'
                    }
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: timePoints,
                axisLine: {
                    lineStyle: {
                        color: '#4a3d30'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#4a3d30'
                    }
                },
                axisLabel: {
                    color: '#b8a88a',
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
                    color: '#b8a88a',
                    padding: [0, 0, 0, 40]
                },
                axisLine: {
                    lineStyle: {
                        color: '#4a3d30'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#4a3d30'
                    }
                },
                axisLabel: {
                    color: '#b8a88a',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: {
                        color: '#322822',
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