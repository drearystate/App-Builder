class MemoryManager {
    constructor() {
        this.references = new WeakMap();
        this.observers = new WeakSet();
        this.gcThreshold = 0.9; // 90% memory usage threshold
        this.initializeMemoryManagement();
    }

    initializeMemoryManagement() {
        this.setupMemoryMonitoring();
        this.setupGarbageCollection();
        this.setupLeakDetection();
        this.setupReferenceTracking();
    }

    setupMemoryMonitoring() {
        if ('performance' in window) {
            this.memoryTimer = setInterval(() => {
                const memory = performance.memory;
                if (memory) {
                    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                    if (usageRatio > this.gcThreshold) {
                        this.triggerGarbageCollection();
                    }
                }
            }, 30000); // Check every 30 seconds
        }
    }

    trackReference(object, metadata = {}) {
        this.references.set(object, {
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0,
            ...metadata
        });
    }

    accessReference(object) {
        if (this.references.has(object)) {
            const ref = this.references.get(object);
            ref.lastAccessed = Date.now();
            ref.accessCount++;
        }
    }

    releaseReference(object) {
        if (this.references.has(object)) {
            // Cleanup any event listeners or observers
            this.cleanupObjectReferences(object);
            this.references.delete(object);
        }
    }

    cleanupObjectReferences(object) {
        // Remove event listeners
        if (object.removeAllListeners) {
            object.removeAllListeners();
        }

        // Remove DOM references
        if (object.element) {
            object.element = null;
        }

        // Clear arrays and maps
        if (object.clear) {
            object.clear();
        }
    }

    detectLeaks() {
        const now = Date.now();
        const staleThreshold = 30 * 60 * 1000; // 30 minutes

        this.references.forEach((ref, object) => {
            if (now - ref.lastAccessed > staleThreshold) {
                console.warn('Potential memory leak detected:', object);
                this.handleLeak(object, ref);
            }
        });
    }

    handleLeak(object, reference) {
        console.warn('Memory leak detected:', {
            object,
            createdAt: reference.createdAt,
            lastAccessed: reference.lastAccessed,
            accessCount: reference.accessCount
        });

        // Attempt to clean up the leak
        this.releaseReference(object);
    }

    triggerGarbageCollection() {
        // Clear all weak references
        this.references = new WeakMap();
        
        // Clear caches
        this.clearCaches();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    clearCaches() {
        // Clear component cache
        if (window.componentRegistry) {
            window.componentRegistry.clearCache();
        }

        // Clear template cache
        if (window.templateCache) {
            window.templateCache.clear();
        }

        // Clear event cache
        if (window.eventManager) {
            window.eventManager.clearCache();
        }
    }

    cleanup() {
        clearInterval(this.memoryTimer);
        this.references = new WeakMap();
        this.observers = new WeakSet();
    }
} 