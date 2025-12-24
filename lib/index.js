const path = require('path');
const fs = require('fs');

// Try to load the native addon (node-gyp build)
let binding;
try {
    binding = require('../build/Release/paddle_ocr_ncnn.node');
} catch (e) {
    try {
        binding = require('../build/Debug/paddle_ocr_ncnn.node');
    } catch (e2) {
        throw new Error(
            'Failed to load paddle-ocr-ncnn native addon. ' +
            'Please ensure you have built the project with `npm run rebuild`. ' +
            'Make sure ncnn and OpenCV are installed. ' +
            'Original error: ' + e.message
        );
    }
}

/**
 * OCR Engine class for text detection and recognition
 */
class PaddleOCR {
    /**
     * Create a new PaddleOCR instance
     */
    constructor() {
        this._engine = new binding.OCREngine();
        this._initialized = false;
    }

    /**
     * Initialize the OCR engine with a config file
     * @param {string} configPath - Path to the config.json file
     * @returns {boolean} - True if initialization was successful
     */
    init(configPath) {
        const absolutePath = path.resolve(configPath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Config file not found: ${absolutePath}`);
        }
        this._initialized = this._engine.initialize(absolutePath);
        return this._initialized;
    }

    /**
     * Detect and recognize text in an image file
     * @param {string} imagePath - Path to the image file
     * @returns {Array<OCRResult>} - Array of detected text regions with recognition results
     */
    detect(imagePath) {
        if (!this._initialized) {
            throw new Error('OCR engine not initialized. Call init() first.');
        }
        const absolutePath = path.resolve(imagePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Image file not found: ${absolutePath}`);
        }
        return this._engine.detect(absolutePath);
    }

    /**
     * Detect and recognize text in an image buffer
     * @param {Buffer} buffer - Image data as a Buffer
     * @returns {Array<OCRResult>} - Array of detected text regions with recognition results
     */
    detectBuffer(buffer) {
        if (!this._initialized) {
            throw new Error('OCR engine not initialized. Call init() first.');
        }
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Expected a Buffer');
        }
        return this._engine.detectBuffer(buffer);
    }

    /**
     * Check if the engine is initialized
     * @returns {boolean}
     */
    get isInitialized() {
        return this._initialized;
    }
}

/**
 * Create a new PaddleOCR instance
 * @param {string} [configPath] - Optional config path to auto-initialize
 * @returns {PaddleOCR}
 */
function createOCR(configPath) {
    const ocr = new PaddleOCR();
    if (configPath) {
        ocr.init(configPath);
    }
    return ocr;
}

module.exports = {
    PaddleOCR,
    createOCR,
    // Also export the raw binding for advanced usage
    _binding: binding
};
