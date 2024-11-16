// Get access to different systems
const componentSystem = editor.integrator.getSystem('component');
const formSystem = editor.integrator.getSystem('form');
const undoRedoSystem = editor.integrator.getSystem('undoRedo');

// Example: Register a new component with form integration
componentSystem.registerComponent('contact-form', {
    template: `
        <form class="contact-form">
            <input type="text" name="name" required>
            <input type="email" name="email" required>
            <button type="submit">Submit</button>
        </form>
    `,
    methods: {
        async handleSubmit(formData) {
            // Form submission with validation and undo/redo support
            try {
                // Start recording for undo/redo
                undoRedoSystem.startRecording();

                // Validate form
                const isValid = await formSystem.validateForm(formData);
                
                if (isValid) {
                    // Process form submission
                    await formSystem.submitForm(formData);
                    
                    // Create undo point
                    undoRedoSystem.createSnapshot();
                }
            } catch (error) {
                // Error will be automatically handled by error boundary
                console.error('Form submission error:', error);
            }
        }
    }
}); 