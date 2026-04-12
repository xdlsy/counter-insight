// static/js/dataProcessor.js

class DataProcessor {
    constructor() {
        this.data = [];
    }

    setData(csvData) {
        // 解析 CSV
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',');

        this.data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = values[idx];
                });
                row['数值'] = parseInt(row['数值'], 10);
                this.data.push(row);
            }
        }

        // 获取所有实例和计数
        this.instances = [...new Set(this.data.map(d => d['实例名称']))];
        this.metrics = [...new Set(this.data.map(d => d['计数名称']))];
    }

    getInstances() {
        return this.instances;
    }

    getMetrics() {
        return this.metrics;
    }

    filterData(instances, metrics) {
        return this.data.filter(d => {
            const instanceMatch = instances.length === 0 || instances.includes(d['实例名称']);
            const metricMatch = metrics.length === 0 || metrics.includes(d['计数名称']);
            return instanceMatch && metricMatch;
        });
    }

    groupByTime(data) {
        // 按时间分组
        const grouped = {};
        data.forEach(d => {
            const time = d['时间'];
            if (!grouped[time]) {
                grouped[time] = [];
            }
            grouped[time].push(d);
        });

        // 转换为图表数据格式
        const timePoints = Object.keys(grouped).sort();
        const series = {};

        data.forEach(d => {
            const key = `${d['实例名称']}-${d['计数名称']}`;
            if (!series[key]) {
                series[key] = [];
            }
        });

        timePoints.forEach(time => {
            const timeData = grouped[time];
            Object.keys(series).forEach(key => {
                const [instance, metric] = key.split('-');
                const match = timeData.find(d => d['实例名称'] === instance && d['计数名称'] === metric);
                series[key].push(match ? match['数值'] : 0);
            });
        });

        return { timePoints, series };
    }
}