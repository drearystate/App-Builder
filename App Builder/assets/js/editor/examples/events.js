// Get systems
const eventSystem = editor.integrator.getSystem('event');
const stateSystem = editor.integrator.getSystem('state');
const analyticsSystem = editor.integrator.getSystem('analytics');

// Listen for events
eventSystem.on('form:submit', async (formData) => {
    // Update state
    await stateSystem.update('forms', {
        lastSubmission: formData
    });

    // Track analytics
    analyticsSystem.trackEvent('form_submission', {
        formId: formData.id,
        timestamp: Date.now()
    });
}); 