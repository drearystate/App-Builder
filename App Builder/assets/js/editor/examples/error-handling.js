// Get error system
const errorSystem = editor.integrator.getSystem('error');

// Register custom error handler
errorSystem.registerErrorHandler('custom', async (error) => {
    // Handle specific error types
    if (error.type === 'validation') {
        const formSystem = editor.integrator.getSystem('form');
        await formSystem.resetValidation();
    }
});

// Using try-catch with system integration
try {
    await someOperation();
} catch (error) {
    // The error will be automatically handled by the error system
    errorSystem.handleError(error);
} 