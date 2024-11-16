const fs = require('fs');
const path = require('path');

const operations = {
    // Files to delete
    delete: [
        'assets/js/editor/ErrorBoundaryManager.js',
        'assets/js/editor/systems/ErrorHandlingSystem.js',
        'assets/js/editor/PerformanceOptimizationManager.js',
        'assets/js/editor/systems/PerformanceManager.js',
        'assets/js/editor/state/StateManager.js',
        'assets/js/editor/EventBusManager.js'
    ],

    // Files to create/move
    create: [
        {
            path: 'assets/js/editor/core/ErrorManager.js',
            content: '/* Error Manager content */'
        },
        {
            path: 'assets/js/editor/core/PerformanceManager.js',
            content: '/* Performance Manager content */'
        },
        {
            path: 'assets/js/editor/core/StateManager.js',
            content: '/* State Manager content */'
        },
        {
            path: 'assets/js/editor/core/EventManager.js',
            content: '/* Event Manager content */'
        }
    ],

    // Files to rename
    rename: [
        {
            from: 'assets/js/editor/ComponentRegistryManager.js',
            to: 'assets/js/editor/components/ComponentRegistry.js'
        },
        {
            from: 'assets/js/editor/ComponentCommunicationManager.js',
            to: 'assets/js/editor/components/ComponentMessaging.js'
        }
    ]
};

// Create directories if they don't exist
const createDirectories = () => {
    const dirs = [
        'assets/js/editor/core',
        'assets/js/editor/components',
        'assets/js/editor/features',
        'assets/js/editor/utils',
        'assets/js/editor/integration'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Delete old files
const deleteFiles = () => {
    operations.delete.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`Deleted: ${file}`);
        }
    });
};

// Create new files
const createFiles = () => {
    operations.create.forEach(file => {
        fs.writeFileSync(file.path, file.content);
        console.log(`Created: ${file.path}`);
    });
};

// Rename files
const renameFiles = () => {
    operations.rename.forEach(({ from, to }) => {
        if (fs.existsSync(from)) {
            fs.renameSync(from, to);
            console.log(`Renamed: ${from} → ${to}`);
        }
    });
};

// Update imports in all JS files
const updateImports = () => {
    const updateImportsInFile = (filePath) => {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Update import paths
        content = content.replace(
            /from ['"]\.\.?\/(ErrorBoundaryManager|systems\/ErrorHandlingSystem)['"];/g,
            `from '../core/ErrorManager';`
        );
        content = content.replace(
            /from ['"]\.\.?\/(PerformanceOptimizationManager|systems\/PerformanceManager)['"];/g,
            `from '../core/PerformanceManager';`
        );
        // Add more replacements as needed

        fs.writeFileSync(filePath, content);
        console.log(`Updated imports in: ${filePath}`);
    };

    // Recursively find all JS files
    const walkDir = (dir) => {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                walkDir(filePath);
            } else if (path.extname(file) === '.js') {
                updateImportsInFile(filePath);
            }
        });
    };

    walkDir('assets/js/editor');
};

// Run the restructuring
const restructure = async () => {
    try {
        createDirectories();
        deleteFiles();
        createFiles();
        renameFiles();
        updateImports();
        console.log('Restructuring completed successfully!');
    } catch (error) {
        console.error('Error during restructuring:', error);
    }
};

restructure(); 