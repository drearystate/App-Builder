class Editor {
    // ... other methods ...

    destroy() {
        // Clean up all systems
        this.integrator.cleanup();
    }
} 