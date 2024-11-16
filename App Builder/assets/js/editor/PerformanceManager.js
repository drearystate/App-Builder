class PerformanceManager {
    constructor() {
        this.metrics = new Map();
        this.marks = new Map();
        this.measures = new Map();
        this.observers = new Map();
        this.thresholds = new Map();
        this.initializeMonitoring();
    }

    initializeMonitoring() {
        // Initialize performance observers
        this.createPerformanceObservers();
        
        // Set default thresholds
        this.setDefaultThresholds();
        
        // Start monitoring
        this.startMonitoring();
    }

    createPerformanceObservers() {
        // Long Task Observer
        if (window.PerformanceObserver) {
            const longTaskObserver = new PerformanceObserver(entries => {
                entries.getEntries().forEach(entry => {
                    this.recordMetric('longTask', {
                        duration: entry.duration,
                        startTime: entry.startTime,
                        name: entry.name
                    });
                });
            });

            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longTask', longTaskObserver);
            } catch (e) {
                console.warn('LongTask observer not supported');
            }

            // Layout Shifts Observer
            const layoutShiftObserver = new PerformanceObserver(entries => {
                entries.getEntries().forEach(entry => {
                    this.recordMetric('layoutShift', {
                        value: entry.value,
                        startTime: entry.startTime,
                        hadRecentInput: entry.hadRecentInput
                    });
                });
            });

            try {
                layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('layoutShift', layoutShiftObserver);
            } catch (e) {
                console.warn('Layout Shift observer not supported');
            }
        }
    }

    setDefaultThresholds() {
        this.thresholds.set('renderTime', 16); // 60fps target
        this.thresholds.set('interactionTime', 100);
        this.thresholds.set('loadTime', 1000);
        this.thresholds.set('memoryUsage', 50000000); // 50MB
    }

    startMonitoring() {
        // Monitor frame rate
        this.startFrameRateMonitoring();
        
        // Monitor memory usage
        this.startMemoryMonitoring();
        
        // Monitor network requests
        this.startNetworkMonitoring();
    }

    startFrameRateMonitoring() {
        let lastTime = performance.now();
        let frames = 0;

        const measureFrameRate = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.recordMetric('fps', frames);
                frames = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFrameRate);
        };

        requestAnimationFrame(measureFrameRate);
    }

    startMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                this.recordMetric('memory', {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                });
            }, 5000);
        }
    }

    startNetworkMonitoring() {
        if (window.PerformanceObserver) {
            const networkObserver = new PerformanceObserver(entries => {
                entries.getEntries().forEach(entry => {
                    this.recordMetric('network', {
                        name: entry.name,
                        duration: entry.duration,
                        transferSize: entry.transferSize,
                        initiatorType: entry.initiatorType
                    });
                });
            });

            try {
                networkObserver.observe({ entryTypes: ['resource'] });
                this.observers.set('network', networkObserver);
            } catch (e) {
                console.warn('Network observer not supported');
            }
        }
    }

    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const metric = {
            value,
            timestamp: Date.now()
        };

        this.metrics.get(name).push(metric);
        this.checkThreshold(name, value);
    }

    mark(name) {
        const mark = performance.mark(name);
        this.marks.set(name, mark);
    }

    measure(name, startMark, endMark) {
        const measure = performance.measure(name, startMark, endMark);
        this.measures.set(name, measure);
        this.recordMetric(name, measure.duration);
    }

    getMetrics(name, timeRange = 60000) {
        if (!this.metrics.has(name)) return [];

        const now = Date.now();
        return this.metrics.get(name).filter(metric => 
            now - metric.timestamp <= timeRange
        );
    }

    getAverageMetric(name, timeRange) {
        const metrics = this.getMetrics(name, timeRange);
        if (metrics.length === 0) return 0;

        const sum = metrics.reduce((acc, metric) => 
            acc + (typeof metric.value === 'number' ? metric.value : 0), 0
        );
        return sum / metrics.length;
    }

    setThreshold(metricName, threshold, callback) {
        this.thresholds.set(metricName, {
            value: threshold,
            callback
        });
    }

    checkThreshold(name, value) {
        const threshold = this.thresholds.get(name);
        if (threshold && value > threshold.value && threshold.callback) {
            threshold.callback({
                metric: name,
                value,
                threshold: threshold.value,
                timestamp: Date.now()
            });
        }
    }

    generatePerformanceReport(timeRange = 3600000) { // Default: last hour
        const report = {
            timestamp: Date.now(),
            timeRange,
            metrics: {},
            marks: Array.from(this.marks.entries()),
            measures: Array.from(this.measures.entries())
        };

        // Aggregate metrics
        this.metrics.forEach((values, name) => {
            report.metrics[name] = {
                average: this.getAverageMetric(name, timeRange),
                min: Math.min(...values.map(v => v.value)),
                max: Math.max(...values.map(v => v.value)),
                count: values.length
            };
        });

        return report;
    }

    cleanup() {
        // Stop all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Clear metrics
        this.metrics.clear();
        this.marks.clear();
        this.measures.clear();
    }
} 