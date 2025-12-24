const path = require('path');
const fs = require('fs');

/**
 * Detect if running in Electron and get ABI version
 */
function getRuntime() {
    if (process.versions.electron) {
        return {
            runtime: 'electron',
            abi: process.versions.modules
        };
    }
    return {
        runtime: 'node',
        abi: process.versions.modules
    };
}

/**
 * Load native binding with prebuild support
 */
function loadBinding() {
    const bindingName = 'paddle_ocr_ncnn.node';
    const rootDir = path.join(__dirname, '..');
    const platform = process.platform;
    const arch = process.arch;
    const { runtime, abi } = getRuntime();

    // 1. Try Electron-specific prebuild first
    if (runtime === 'electron') {
        const electronPrebuildsDir = path.join(rootDir, 'prebuilds', `${platform}-${arch}-electron`);
        if (fs.existsSync(electronPrebuildsDir)) {
            // Try exact ABI match first
            const exactMatch = path.join(electronPrebuildsDir, `node.abi${abi}.node`);
            if (fs.existsSync(exactMatch)) {
                return require(exactMatch);
            }
            // Fall back to any .node file in the directory
            const files = fs.readdirSync(electronPrebuildsDir);
            const nodeFile = files.find(f => f.endsWith('.node'));
            if (nodeFile) {
                return require(path.join(electronPrebuildsDir, nodeFile));
            }
        }
    }

    // 2. Try prebuild-install location (prebuilds/platform-arch/node.napi.node)
    try {
        const prebuildInstall = require('prebuild-install');
        const prebuildPath = prebuildInstall.getPath(rootDir);
        if (prebuildPath && fs.existsSync(prebuildPath)) {
            return require(prebuildPath);
        }
    } catch (e) {
        // prebuild-install not available or failed
    }

    // 3. Try prebuilds folder directly (for bundled prebuilds)
    const prebuildsDir = path.join(rootDir, 'prebuilds', `${platform}-${arch}`);

    if (fs.existsSync(prebuildsDir)) {
        const files = fs.readdirSync(prebuildsDir);
        const nodeFile = files.find(f => f.endsWith('.node'));
        if (nodeFile) {
            return require(path.join(prebuildsDir, nodeFile));
        }
    }

    // 4. Try node-gyp build locations
    const buildPaths = [
        path.join(rootDir, 'build', 'Release', bindingName),
        path.join(rootDir, 'build', 'Debug', bindingName)
    ];

    for (const buildPath of buildPaths) {
        if (fs.existsSync(buildPath)) {
            return require(buildPath);
        }
    }

    throw new Error(
        `Failed to load paddle-ocr-ncnn native addon. ` +
        `Runtime: ${runtime}, ABI: ${abi}, Platform: ${platform}-${arch}. ` +
        'No prebuilt binary found for your platform. ' +
        'Please run `npm run rebuild` to build from source. ' +
        'Make sure ncnn and OpenCV are installed.'
    );
}

const binding = loadBinding();

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
