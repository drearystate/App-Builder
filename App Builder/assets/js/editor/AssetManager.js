class AssetManager {
    constructor() {
        this.assets = new Map();
        this.cache = new Map();
        this.loaders = new Map();
        this.optimizers = new Map();
        this.uploadQueue = new Queue();
        this.maxCacheSize = 100 * 1024 * 1024; // 100MB
        this.currentCacheSize = 0;
        this.supportedTypes = new Set();
        this.initializeAssetManager();
    }

    initializeAssetManager() {
        this.setupAssetLoaders();
        this.setupAssetOptimizers();
        this.setupSupportedTypes();
        this.initializeCache();
    }

    setupAssetLoaders() {
        // Image loader
        this.registerLoader('image', async (url, options) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
                img.src = url;
            });
        });

        // Video loader
        this.registerLoader('video', async (url, options) => {
            return new Promise((resolve, reject) => {
                const video = document.createElement('video');
                video.onloadeddata = () => resolve(video);
                video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
                video.src = url;
            });
        });

        // Audio loader
        this.registerLoader('audio', async (url, options) => {
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.onloadeddata = () => resolve(audio);
                audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
                audio.src = url;
            });
        });

        // Font loader
        this.registerLoader('font', async (url, options) => {
            const font = new FontFace(options.fontFamily, `url(${url})`);
            await font.load();
            document.fonts.add(font);
            return font;
        });
    }

    setupAssetOptimizers() {
        // Image optimizer
        this.registerOptimizer('image', async (file, options) => {
            const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;
            
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let { width, height } = img;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => resolve(blob),
                        'image/jpeg',
                        quality
                    );
                };

                img.src = URL.createObjectURL(file);
            });
        });

        // Video optimizer
        this.registerOptimizer('video', async (file, options) => {
            // Implement video optimization logic
            return file;
        });

        // Audio optimizer
        this.registerOptimizer('audio', async (file, options) => {
            // Implement audio optimization logic
            return file;
        });
    }

    setupSupportedTypes() {
        // Images
        this.supportedTypes.add('image/jpeg');
        this.supportedTypes.add('image/png');
        this.supportedTypes.add('image/gif');
        this.supportedTypes.add('image/webp');

        // Videos
        this.supportedTypes.add('video/mp4');
        this.supportedTypes.add('video/webm');

        // Audio
        this.supportedTypes.add('audio/mp3');
        this.supportedTypes.add('audio/wav');
        this.supportedTypes.add('audio/ogg');

        // Documents
        this.supportedTypes.add('application/pdf');
        this.supportedTypes.add('application/json');
    }

    async loadAsset(url, type, options = {}) {
        const cacheKey = this.generateCacheKey(url, options);

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const loader = this.loaders.get(type);
        if (!loader) {
            throw new Error(`No loader registered for type: ${type}`);
        }

        try {
            const asset = await loader(url, options);
            this.cacheAsset(cacheKey, asset);
            return asset;
        } catch (error) {
            console.error(`Failed to load asset: ${url}`, error);
            throw error;
        }
    }

    async uploadAsset(file, options = {}) {
        if (!this.supportedTypes.has(file.type)) {
            throw new Error(`Unsupported file type: ${file.type}`);
        }

        return new Promise((resolve, reject) => {
            this.uploadQueue.enqueue(async () => {
                try {
                    const optimizedFile = await this.optimizeAsset(file, options);
                    const assetInfo = await this.uploadToServer(optimizedFile);
                    this.assets.set(assetInfo.id, assetInfo);
                    resolve(assetInfo);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async optimizeAsset(file, options) {
        const type = file.type.split('/')[0];
        const optimizer = this.optimizers.get(type);
        
        if (!optimizer) {
            return file;
        }

        return await optimizer(file, options);
    }

    async uploadToServer(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/assets/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return await response.json();
    }

    registerLoader(type, loaderFn) {
        this.loaders.set(type, loaderFn);
    }

    registerOptimizer(type, optimizerFn) {
        this.optimizers.set(type, optimizerFn);
    }

    generateCacheKey(url, options) {
        return `${url}:${JSON.stringify(options)}`;
    }

    cacheAsset(key, asset) {
        const size = this.getAssetSize(asset);

        // Ensure cache doesn't exceed max size
        while (this.currentCacheSize + size > this.maxCacheSize) {
            const [oldestKey] = this.cache.keys();
            this.removeFromCache(oldestKey);
        }

        this.cache.set(key, asset);
        this.currentCacheSize += size;
    }

    removeFromCache(key) {
        const asset = this.cache.get(key);
        if (asset) {
            this.currentCacheSize -= this.getAssetSize(asset);
            this.cache.delete(key);
        }
    }

    getAssetSize(asset) {
        if (asset instanceof Blob) {
            return asset.size;
        }
        if (asset instanceof HTMLImageElement) {
            return asset.width * asset.height * 4; // Rough estimate for RGBA
        }
        return 0; // Default for unknown assets
    }

    clearCache() {
        this.cache.clear();
        this.currentCacheSize = 0;
    }

    getAsset(id) {
        return this.assets.get(id);
    }

    removeAsset(id) {
        const asset = this.assets.get(id);
        if (asset) {
            // Remove from server
            fetch(`/api/assets/${id}`, { method: 'DELETE' });
            this.assets.delete(id);
        }
    }

    preloadAssets(urls) {
        return Promise.all(
            urls.map(url => {
                const type = this.getAssetType(url);
                return this.loadAsset(url, type);
            })
        );
    }

    getAssetType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const typeMap = {
            jpg: 'image',
            jpeg: 'image',
            png: 'image',
            gif: 'image',
            webp: 'image',
            mp4: 'video',
            webm: 'video',
            mp3: 'audio',
            wav: 'audio',
            ogg: 'audio',
            pdf: 'document'
        };
        return typeMap[extension] || 'unknown';
    }
}

// Helper class for managing upload queue
class Queue {
    constructor() {
        this.items = [];
        this.processing = false;
    }

    enqueue(task) {
        this.items.push(task);
        this.process();
    }

    async process() {
        if (this.processing) return;
        this.processing = true;

        while (this.items.length > 0) {
            const task = this.items.shift();
            try {
                await task();
            } catch (error) {
                console.error('Queue task error:', error);
            }
        }

        this.processing = false;
    }
} 