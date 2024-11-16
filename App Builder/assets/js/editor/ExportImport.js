class ExportImportManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.supportedFormats = ['json', 'html', 'react', 'vue'];
    }

    async exportProject(format = 'json') {
        const projectData = this.prepareProjectData();
        
        switch (format) {
            case 'json':
                return this.exportAsJSON(projectData);
            case 'html':
                return this.exportAsHTML(projectData);
            case 'react':
                return this.exportAsReact(projectData);
            case 'vue':
                return this.exportAsVue(projectData);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    prepareProjectData() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            metadata: {
                name: this.stateManager.state.projectName,
                description: this.stateManager.state.projectDescription,
                author: this.stateManager.state.author
            },
            components: Array.from(this.stateManager.state.components.values()),
            styles: this.stateManager.state.styles,
            assets: this.stateManager.state.assets,
            actions: Array.from(this.stateManager.state.actions.values())
        };
    }

    exportAsJSON(projectData) {
        const json = JSON.stringify(projectData, null, 2);
        return {
            content: json,
            filename: `${projectData.metadata.name}-${Date.now()}.json`,
            type: 'application/json'
        };
    }

    exportAsHTML(projectData) {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectData.metadata.name}</title>
    <style>
        ${this.generateCSS(projectData.styles)}
    </style>
</head>
<body>
    ${this.generateHTML(projectData.components)}
    <script>
        ${this.generateJavaScript(projectData.actions)}
    </script>
</body>
</html>`;

        return {
            content: html,
            filename: `${projectData.metadata.name}-${Date.now()}.html`,
            type: 'text/html'
        };
    }

    exportAsReact(projectData) {
        const components = this.generateReactComponents(projectData.components);
        const styles = this.generateReactStyles(projectData.styles);
        
        return {
            files: [
                {
                    content: components,
                    filename: 'components.jsx',
                    type: 'text/javascript'
                },
                {
                    content: styles,
                    filename: 'styles.js',
                    type: 'text/javascript'
                }
            ]
        };
    }

    exportAsVue(projectData) {
        const components = this.generateVueComponents(projectData.components);
        
        return {
            files: components.map(component => ({
                content: component.content,
                filename: `${component.name}.vue`,
                type: 'text/vue'
            }))
        };
    }

    async importProject(file) {
        try {
            const content = await this.readFile(file);
            const projectData = JSON.parse(content);
            
            // Validate project data
            this.validateProjectData(projectData);
            
            // Clear current state
            this.stateManager.clearState();
            
            // Import components
            projectData.components.forEach(component => {
                this.stateManager.addComponent(component);
            });
            
            // Import styles
            this.stateManager.state.styles = projectData.styles;
            
            // Import actions
            projectData.actions.forEach(action => {
                this.stateManager.addAction(action);
            });
            
            // Import metadata
            Object.assign(this.stateManager.state, {
                projectName: projectData.metadata.name,
                projectDescription: projectData.metadata.description,
                author: projectData.metadata.author
            });
            
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            throw new Error('Failed to import project: ' + error.message);
        }
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    validateProjectData(projectData) {
        const requiredFields = ['version', 'components', 'styles', 'actions', 'metadata'];
        requiredFields.forEach(field => {
            if (!projectData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        });
    }
} 