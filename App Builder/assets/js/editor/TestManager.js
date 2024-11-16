class TestManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.tests = new Map();
        this.testResults = new Map();
        this.mockData = new Map();
        this.initializeTestEnvironment();
    }

    initializeTestEnvironment() {
        this.testContainer = document.createElement('div');
        this.testContainer.id = 'test-environment';
        this.testContainer.style.display = 'none';
        document.body.appendChild(this.testContainer);
    }

    async runTests(componentId = null) {
        const testsToRun = componentId 
            ? new Map([[componentId, this.tests.get(componentId)]])
            : this.tests;

        this.testResults.clear();
        
        for (const [id, componentTests] of testsToRun) {
            const results = await this.runComponentTests(id, componentTests);
            this.testResults.set(id, results);
        }

        return this.generateTestReport();
    }

    async runComponentTests(componentId, tests) {
        const results = {
            passed: 0,
            failed: 0,
            total: tests.length,
            details: []
        };

        for (const test of tests) {
            try {
                const component = await this.setupTestComponent(componentId);
                await test.run(component);
                results.passed++;
                results.details.push({
                    name: test.name,
                    status: 'passed',
                    duration: test.duration
                });
            } catch (error) {
                results.failed++;
                results.details.push({
                    name: test.name,
                    status: 'failed',
                    error: error.message,
                    duration: test.duration
                });
            } finally {
                this.cleanupTestComponent();
            }
        }

        return results;
    }

    async setupTestComponent(componentId) {
        const component = this.stateManager.getComponent(componentId);
        const testInstance = await this.renderComponent(component);
        return testInstance;
    }

    cleanupTestComponent() {
        this.testContainer.innerHTML = '';
    }

    async renderComponent(component) {
        const element = document.createElement('div');
        element.setAttribute('data-testid', component.id);
        this.testContainer.appendChild(element);
        
        // Render component using the state manager
        await this.stateManager.renderComponent(component, element);
        return element;
    }

    registerTest(componentId, test) {
        if (!this.tests.has(componentId)) {
            this.tests.set(componentId, []);
        }
        this.tests.get(componentId).push(test);
    }

    createTest(name, testFn) {
        return {
            name,
            duration: 0,
            async run(component) {
                const start = performance.now();
                await testFn(component);
                this.duration = performance.now() - start;
            }
        };
    }

    mockData(key, data) {
        this.mockData.set(key, data);
    }

    clearMocks() {
        this.mockData.clear();
    }

    generateTestReport() {
        const report = {
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                duration: 0
            },
            components: []
        };

        this.testResults.forEach((result, componentId) => {
            report.summary.total += result.total;
            report.summary.passed += result.passed;
            report.summary.failed += result.failed;
            
            const componentReport = {
                componentId,
                ...result,
                duration: result.details.reduce((sum, test) => sum + test.duration, 0)
            };
            
            report.components.push(componentReport);
            report.summary.duration += componentReport.duration;
        });

        return report;
    }

    // Assertion helpers
    async assertVisible(element) {
        const isVisible = element.offsetParent !== null;
        if (!isVisible) throw new Error('Element is not visible');
    }

    async assertText(element, text) {
        if (element.textContent !== text) {
            throw new Error(`Expected text "${text}" but found "${element.textContent}"`);
        }
    }

    async assertProperty(element, property, value) {
        const actual = element[property];
        if (actual !== value) {
            throw new Error(`Expected ${property} to be "${value}" but found "${actual}"`);
        }
    }

    async assertEvent(element, eventName) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Event "${eventName}" was not triggered`));
            }, 1000);

            element.addEventListener(eventName, () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        });
    }
} 