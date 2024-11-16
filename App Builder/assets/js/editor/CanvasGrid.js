class CanvasGrid {
    constructor(canvas) {
        this.canvas = canvas;
        this.gridSize = 10;
        this.showGrid = true;
        this.snapToGrid = true;
        
        this.initializeGrid();
    }

    initializeGrid() {
        this.gridCanvas = document.createElement('canvas');
        this.gridCanvas.className = 'grid-canvas';
        this.canvas.appendChild(this.gridCanvas);
        
        this.ctx = this.gridCanvas.getContext('2d');
        this.resizeGrid();
        this.drawGrid();

        window.addEventListener('resize', () => {
            this.resizeGrid();
            this.drawGrid();
        });
    }

    resizeGrid() {
        this.gridCanvas.width = this.canvas.clientWidth;
        this.gridCanvas.height = this.canvas.clientHeight;
    }

    drawGrid() {
        if (!this.showGrid) {
            this.ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
            return;
        }

        this.ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // Draw vertical lines
        for (let x = 0; x <= this.gridCanvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.gridCanvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.gridCanvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.gridCanvas.width, y);
            this.ctx.stroke();
        }
    }

    snapToGridValue(value) {
        if (!this.snapToGrid) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.drawGrid();
    }

    toggleSnap() {
        this.snapToGrid = !this.snapToGrid;
    }

    setGridSize(size) {
        this.gridSize = size;
        this.drawGrid();
    }
} 