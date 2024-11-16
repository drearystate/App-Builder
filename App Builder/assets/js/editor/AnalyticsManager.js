class AnalyticsManager {
    constructor() {
        this.events = new Map();
        this.metrics = new Map();
        this.sessions = new Map();
        this.providers = new Map();
        this.queue = [];
        this.config = {
            sampleRate: 1.0,
            batchSize: 10,
            flushInterval: 30000, // 30 seconds
            errorSampleRate: 1.0
        };
        this.initializeAnalytics();
    }

    initializeAnalytics() {
        this.setupProviders();
        this.setupEventTracking();
        this.setupPerformanceTracking();
        this.setupErrorTracking();
        this.setupUserTracking();
        this.startAutoFlush();
    }

    setupProviders() {
        // Google Analytics provider
        this.registerProvider('ga', {
            initialize: () => {
                // Initialize Google Analytics
                if (typeof ga !== 'undefined') {
                    ga('create', this.config.gaId, 'auto');
                }
            },
            trackEvent: (event) => {
                if (typeof ga !== 'undefined') {
                    ga('send', 'event', event.category, event.action, event.label, event.value);
                }
            },
            trackError: (error) => {
                if (typeof ga !== 'undefined') {
                    ga('send', 'exception', {
                        exDescription: error.message,
                        exFatal: error.fatal
                    });
                }
            }
        });

        // Custom analytics provider
        this.registerProvider('custom', {
            initialize: () => {
                // Setup custom analytics endpoint
                this.customEndpoint = '/api/analytics';
            },
            trackEvent: async (event) => {
                await this.sendToEndpoint(this.customEndpoint, {
                    type: 'event',
                    data: event
                });
            },
            trackError: async (error) => {
                await this.sendToEndpoint(this.customEndpoint, {
                    type: 'error',
                    data: error
                });
            }
        });
    }

    setupEventTracking() {
        // User interaction tracking
        this.trackUserInteractions();
        
        // Feature usage tracking
        this.trackFeatureUsage();
        
        // Navigation tracking
        this.trackNavigation();
        
        // Form interaction tracking
        this.trackFormInteractions();
    }

    setupPerformanceTracking() {
        // Performance metrics tracking
        if ('PerformanceObserver' in window) {
            // Core Web Vitals
            this.trackWebVitals();
            
            // Custom performance metrics
            this.trackCustomMetrics();
            
            // Resource timing
            this.trackResourceTiming();
        }
    }

    setupErrorTracking() {
        // Global error handler
        window.onerror = (message, source, lineno, colno, error) => {
            this.trackError({
                message,
                source,
                lineno,
                colno,
                error,
                type: 'uncaught'
            });
        };

        // Promise rejection handler
        window.onunhandledrejection = (event) => {
            this.trackError({
                message: event.reason,
                type: 'unhandledrejection'
            });
        };
    }

    setupUserTracking() {
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            interactions: 0,
            pages: new Set()
        };

        // Track session data
        this.trackSession();
    }

    trackUserInteractions() {
        const interactionEvents = ['click', 'input', 'change', 'submit'];
        
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackEvent({
                    category: 'User Interaction',
                    action: eventType,
                    label: this.getElementIdentifier(event.target),
                    value: 1
                });
            });
        });
    }

    trackFeatureUsage() {
        document.addEventListener('feature-used', (event) => {
            const { feature, action, metadata } = event.detail;
            this.trackEvent({
                category: 'Feature Usage',
                action: action,
                label: feature,
                value: 1,
                metadata
            });
        });
    }

    trackNavigation() {
        window.addEventListener('popstate', () => {
            this.trackPageView();
        });

        // Track initial page load
        this.trackPageView();
    }

    trackFormInteractions() {
        document.addEventListener('submit', (event) => {
            if (event.target.tagName === 'FORM') {
                this.trackEvent({
                    category: 'Form',
                    action: 'submit',
                    label: this.getFormIdentifier(event.target)
                });
            }
        });
    }

    trackWebVitals() {
        const webVitals = ['CLS', 'FID', 'LCP'];
        
        webVitals.forEach(metric => {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.trackMetric(metric, entry.value);
                });
            }).observe({ entryTypes: ['layout-shift', 'first-input', 'largest-contentful-paint'] });
        });
    }

    trackCustomMetrics() {
        // Track custom performance marks and measures
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.trackMetric(entry.name, entry.duration);
            });
        }).observe({ entryTypes: ['measure'] });
    }

    trackResourceTiming() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (this.shouldTrackResource(entry)) {
                    this.trackMetric('resource-timing', {
                        name: entry.name,
                        duration: entry.duration,
                        transferSize: entry.transferSize
                    });
                }
            });
        }).observe({ entryTypes: ['resource'] });
    }

    trackSession() {
        // Update session data periodically
        setInterval(() => {
            this.currentSession.duration = Date.now() - this.currentSession.startTime;
            this.sessions.set(this.currentSession.id, this.currentSession);
        }, 60000); // Every minute

        // Track session end
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }

    trackEvent(event) {
        if (!this.shouldSample(event)) return;

        const enrichedEvent = this.enrichEvent(event);
        this.queue.push(enrichedEvent);

        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        }
    }

    trackError(error) {
        if (!this.shouldSampleError(error)) return;

        const enrichedError = this.enrichError(error);
        this.providers.forEach(provider => {
            if (provider.trackError) {
                provider.trackError(enrichedError);
            }
        });
    }

    trackMetric(name, value) {
        this.metrics.set(name, {
            value,
            timestamp: Date.now()
        });

        this.trackEvent({
            category: 'Metrics',
            action: name,
            value: typeof value === 'object' ? JSON.stringify(value) : value
        });
    }

    trackPageView() {
        const page = {
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            timestamp: Date.now()
        };

        this.currentSession.pages.add(page.path);
        
        this.trackEvent({
            category: 'Navigation',
            action: 'pageview',
            label: page.path
        });
    }

    registerProvider(name, provider) {
        this.providers.set(name, provider);
        if (provider.initialize) {
            provider.initialize();
        }
    }

    async flush() {
        if (this.queue.length === 0) return;

        const events = [...this.queue];
        this.queue = [];

        try {
            await Promise.all(
                Array.from(this.providers.values()).map(provider => {
                    if (provider.trackEvent) {
                        return Promise.all(
                            events.map(event => provider.trackEvent(event))
                        );
                    }
                })
            );
        } catch (error) {
            console.error('Error flushing analytics:', error);
            // Requeue failed events
            this.queue.unshift(...events);
        }
    }

    startAutoFlush() {
        setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    enrichEvent(event) {
        return {
            ...event,
            timestamp: Date.now(),
            sessionId: this.currentSession.id,
            userId: this.getUserId(),
            page: window.location.pathname,
            metadata: {
                ...event.metadata,
                userAgent: navigator.userAgent,
                screenSize: `${window.innerWidth}x${window.innerHeight}`
            }
        };
    }

    enrichError(error) {
        return {
            ...error,
            timestamp: Date.now(),
            sessionId: this.currentSession.id,
            userId: this.getUserId(),
            page: window.location.pathname,
            metadata: {
                userAgent: navigator.userAgent,
                screenSize: `${window.innerWidth}x${window.innerHeight}`
            }
        };
    }

    shouldSample(event) {
        return Math.random() < this.config.sampleRate;
    }

    shouldSampleError(error) {
        return Math.random() < this.config.errorSampleRate;
    }

    shouldTrackResource(entry) {
        // Filter out unwanted resource types
        const ignoredTypes = ['beacon', 'ping'];
        return !ignoredTypes.includes(entry.initiatorType);
    }

    getElementIdentifier(element) {
        return element.id || element.name || element.tagName.toLowerCase();
    }

    getFormIdentifier(form) {
        return form.id || form.name || form.action;
    }

    getUserId() {
        // Implement your user identification logic
        return 'anonymous';
    }

    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    endSession() {
        this.currentSession.endTime = Date.now();
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
        
        this.trackEvent({
            category: 'Session',
            action: 'end',
            label: this.currentSession.id,
            value: this.currentSession.duration
        });

        this.flush();
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }

    getSessionData() {
        return {
            current: this.currentSession,
            all: Array.from(this.sessions.values())
        };
    }

    async sendToEndpoint(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Analytics request failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error sending analytics:', error);
            throw error;
        }
    }

    cleanup() {
        this.endSession();
        this.events.clear();
        this.metrics.clear();
        this.sessions.clear();
        this.providers.clear();
        this.queue = [];
    }
} 