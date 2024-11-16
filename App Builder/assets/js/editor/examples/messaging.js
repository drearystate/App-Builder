<!DOCTYPE html>
<html>
<head>
    <title>Editor</title>
    <!-- Include all necessary system files -->
    <script src="assets/js/editor/SystemIntegrator.js"></script>
    <script src="assets/js/editor/StateManager.js"></script>
    <!-- ... other system files ... -->
</head>
<body>
    <div id="editor-root"></div>
    
    <script src="assets/js/editor/main.js"></script>
    <script>
        // Initialize the editor when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            window.editor = new Editor();
        });
    </script>
</body>
</html> 