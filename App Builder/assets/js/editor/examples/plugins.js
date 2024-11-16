// Get plugin system
const pluginSystem = editor.integrator.getSystem('plugin');

// Register a plugin
pluginSystem.registerPlugin({
    name: 'customFormValidation',
    version: '1.0.0',
    
    initialize: async () => {
        const formSystem = editor.integrator.getSystem('form');
        
        // Add custom validation rules
        formSystem.registerValidator('customRule', (value) => {
            return {
                valid: /* your validation logic */,
                message: 'Custom validation message'
            };
        });
    },
    
    cleanup: async () => {
        // Cleanup logic
    }
}); 