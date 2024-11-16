class ErrorManager {
    constructor() {
        this.errors = new Map();
        this.errorHandlers = new Map();
        this.errorLogs = [];
        this.maxLogSize = 100;
        this.initializeErrorHandlers();
    }

    initializeErrorHandlers() {
        // Default error handlers
        this.registerErrorHandler('validation', (error) => {
            return {
                type: 'validation',
                message: 'Validation failed',
                details: error.details,
                timestamp: Date.now()
            };
        });

        this.registerErrorHandler('runtime', (error) => {
            return {
                type: 'runtime',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            };
        });

        this.registerErrorHandler('network', (error) => {
            return {
                type: 'network',
                message: 'Network request failed',
                status: error.status,
                statusText: error.statusText,
                timestamp: Date.now()
            };
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError('runtime', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('runtime', event.reason);
        });
    }

    registerErrorHandler(type, handler) {
        this.errorHandlers.set(type, handler);
    }

    handleError(type, error, componentId = null) {
        const handler = this.errorHandlers.get(type);
        if (!handler) {
            console.warn(`No handler registered for error type: ${type}`);
            return;
        }

        const processedError = handler(error);
        this.logError(processedError, componentId);

        if (componentId) {
            if (!this.errors.has(componentId)) {
                this.errors.set(componentId, []);
            }
            this.errors.get(componentId).push(processedError);
        }

        this.notifyErrorListeners(processedError, componentId);
        return processedError;
    }

    logError(error, componentId) {
        const logEntry = {
            ...error,
            componentId,
            timestamp: Date.now()
        };

        this.errorLogs.unshift(logEntry);
        if (this.errorLogs.length > this.maxLogSize) {
            this.errorLogs.pop();
        }
    }

    getErrors(componentId = null) {
        if (componentId) {
            return this.errors.get(componentId) || [];
        }
        return Array.from(this.errors.values()).flat();
    }

    clearErrors(componentId = null) {
        if (componentId) {
            this.errors.delete(componentId);
        } else {
            this.errors.clear();
        }
    }

    getErrorLogs(filters = {}) {
        let filteredLogs = [...this.errorLogs];

        if (filters.type) {
            filteredLogs = filteredLogs.filter(log => log.type === filters.type);
        }

        if (filters.componentId) {
            filteredLogs = filteredLogs.filter(log => log.componentId === filters.componentId);
        }

        if (filters.startDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate);
        }

        return filteredLogs;
    }

    // Error recovery strategies
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                }
            }
        }

        throw lastError;
    }

    createErrorBoundary(component) {
        return {
            componentDidCatch: (error, errorInfo) => {
                this.handleError('runtime', {
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack
                }, component.id);
            }
        };
    }

    // Error reporting
    generateErrorReport() {
        return {
            summary: this.generateErrorSummary(),
            details: this.errorLogs,
            timestamp: Date.now()
        };
    }

    generateErrorSummary() {
        const summary = {
            total: this.errorLogs.length,
            byType: {},
            byComponent: {}
        };

        this.errorLogs.forEach(log => {
            // Count by type
            summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;

            // Count by component
            if (log.componentId) {
                summary.byComponent[log.componentId] = 
                    (summary.byComponent[log.componentId] || 0) + 1;
            }
        });

        return summary;
    }

    // Error notifications
    notifyErrorListeners(error, componentId) {
        // Implement your notification logic here
        // This could integrate with a notification system or error tracking service
        console.error('Error occurred:', {
            error,
            componentId,
            timestamp: new Date().toISOString()
        });
    }
} 