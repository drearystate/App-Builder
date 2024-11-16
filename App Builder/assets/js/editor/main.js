class Editor {
    constructor() {
        // Create the system integrator
        this.integrator = new SystemIntegrator();
        
        // Initialize the editor
        this.initialize();
    }

    async initialize() {
        // Start all systems
        await this.integrator.start();

        // The editor is now ready to use
        console.log('Editor initialized and ready');
    }
}

// Create and start the editor
const editor = new Editor(); 