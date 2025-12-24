const path = require('path');
const { PaddleOCR, createOCR } = require('../lib/index');

// Path to your config and test image
const CONFIG_PATH = path.join(__dirname, '../models/config.json');
const TEST_IMAGE = process.argv[2] || path.join(__dirname, '../img.png');

async function main() {
    console.log('PaddleOCR Node.js Module Test');
    console.log('==============================\n');

    // Create OCR instance
    const ocr = new PaddleOCR();

    // Initialize with config
    console.log('Initializing OCR engine...');
    console.log('Config path: ' + CONFIG_PATH);

    try {
        const success = ocr.init(CONFIG_PATH);
        if (!success) {
            console.error('Failed to initialize OCR engine');
            process.exit(1);
        }
        console.log('OCR engine initialized successfully!\n');
    } catch (err) {
        console.error('Error initializing OCR engine:', err.message);
        process.exit(1);
    }

    // Detect text
    console.log('Processing image: ' + TEST_IMAGE + '\n');

    try {
        const results = ocr.detect(TEST_IMAGE);

        console.log('Found ' + results.length + ' text region(s):\n');

        results.forEach((result, idx) => {
            console.log('--- Region ' + (idx + 1) + ' ---');
            console.log('Text: ' + result.text);
            console.log('Box Score: ' + (result.boxScore * 100).toFixed(2) + '%');
            console.log('Rotated: ' + result.angle.isRotated);
            console.log('Angle Score: ' + (result.angle.score * 100).toFixed(2) + '%');
            console.log('Bounding Box: ' + JSON.stringify(result.box));
            console.log();
        });
    } catch (err) {
        console.error('Error detecting text:', err.message);
        process.exit(1);
    }
}

main();
