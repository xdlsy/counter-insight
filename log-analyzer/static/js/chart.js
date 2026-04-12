// static/js/chart.js

// ECharts dark theme configuration
const darkTheme = {
    color: [
        '#58a6ff', '#3fb950', '#a371f7', '#d29922',
        '#f85149', '#db61a2', '#79c0ff', '#56d364',
        '#bc8cff', '#e3b341', '#ff7b72', '#f778ba'
    ],
    backgroundColor: 'transparent',
    textStyle: {
        fontFamily: 'Noto Sans SC, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    title: {
        textStyle: {
            color: '#e6edf3',
            fontWeight: 600
        },
        subtextStyle: {
            color: '#8b949e'
        }
    },
    legend: {
        textStyle: {
            color: '#8b949e',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11
        },
        pageTextStyle: {
            color: '#8b949e'
        }
    },
    tooltip: {
        backgroundColor: 'rgba(22, 27, 34, 0.95)',
        borderColor: '#30363d',
        borderWidth: 1,
        textStyle: {
            color: '#e6edf3',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12
        }
    },
    toolbox: {
        iconStyle: {
            borderColor: '#8b949e'
        },
        emphasis: {
            iconStyle: {
                borderColor: '#58a6ff'
            }
        }
    },
    dataZoom: {
        backgroundColor: '#21262d',
        borderColor: '#30363d',
        fillerColor: 'rgba(88, 166, 255, 0.1)',
        handleColor: '#58a6ff',
        handleSize: '100%',
        textStyle: {
            color: '#8b949e'
        }
    },
    xAxis: {
        axisLine: {
            lineStyle: {
                color: '#30363d'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#30363d'
            }
        },
        axisLabel: {
            color: '#8b949e',
            fontFamily: 'JetBrains Mono, monospace'
        },
        splitLine: {
            lineStyle: {
                color: '#21262d',
                type: 'dashed'
            }
        }
    },
    yAxis: {
        axisLine: {
            lineStyle: {
                color: '#30363d'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#30363d'
            }
        },
        axisLabel: {
            color: '#8b949e',
            fontFamily: 'JetBrains Mono, monospace'
        },
        splitLine: {
            lineStyle: {
                color: '#21262d',
                type: 'dashed'
            }
        }
    },
    categoryAxis: {
        axisLine: {
            lineStyle: {
                color: '#30363d'
            }
        },
        axisTick: {
            lineStyle: {
                color: '#30363d'
            }
        },
        axisLabel: {
            color: '#8b949e'
        },
        splitLine: {
            lineStyle: {
                color: '#21262d',
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
            '#58a6ff', '#3fb950', '#a371f7', '#d29922',
            '#f85149', '#db61a2', '#79c0ff', '#56d364'
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
                        color: '#6e7681',
                        fontSize: 18
                    },
                    subtextStyle: {
                        color: '#6e7681',
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
                shadowColor: 'rgba(88, 166, 255, 0.3)',
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
                backgroundColor: 'rgba(22, 27, 34, 0.95)',
                borderColor: '#30363d',
                borderWidth: 1,
                textStyle: {
                    color: '#e6edf3',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12
                },
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#484f58'
                    },
                    lineStyle: {
                        color: '#484f58'
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
                    color: '#8b949e',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11
                },
                pageTextStyle: {
                    color: '#8b949e'
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
                    borderColor: '#8b949e'
                },
                emphasis: {
                    iconStyle: {
                        borderColor: '#58a6ff'
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
                    borderColor: '#30363d',
                    backgroundColor: '#21262d',
                    fillerColor: 'rgba(88, 166, 255, 0.15)',
                    handleStyle: {
                        color: '#58a6ff'
                    },
                    textStyle: {
                        color: '#8b949e'
                    }
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: timePoints,
                axisLine: {
                    lineStyle: {
                        color: '#30363d'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#30363d'
                    }
                },
                axisLabel: {
                    color: '#8b949e',
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
                    color: '#8b949e',
                    padding: [0, 0, 0, 40]
                },
                axisLine: {
                    lineStyle: {
                        color: '#30363d'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#30363d'
                    }
                },
                axisLabel: {
                    color: '#8b949e',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: {
                        color: '#21262d',
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