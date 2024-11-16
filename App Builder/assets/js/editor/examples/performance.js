// Get performance system
const performanceSystem = editor.integrator.getSystem('performance');

// Monitor component performance
performanceSystem.monitorOperation('componentRender', async () => {
    const componentSystem = editor.integrator.getSystem('component');
    await componentSystem.renderComponent('my-component');
}, {
    threshold: 100, // ms
    onThresholdExceeded: (metrics) => {
        console.warn('Component render took too long:', metrics);
    }
}); 