# paddle-ocr-ncnn

Node.js bindings for PaddleOCR (PP-OCRv3/v5) using ncnn inference engine with Vulkan GPU acceleration.

## Installation

```bash
npm install paddle-ocr-ncnn
```

Dependencies are automatically downloaded during installation.

### Prerequisites

**macOS**
```bash
brew install opencv molten-vk
```

**Ubuntu/Debian**
```bash
sudo apt-get install libopencv-dev libvulkan-dev
```

**Windows**
Install Visual Studio 2019+ with C++ support, OpenCV, and Vulkan SDK.

## Download Models

Download models from [PaddleOCR-ncnn-CPP releases](https://github.com/Avafly/PaddleOCR-ncnn-CPP/releases):

```bash
curl -L -o archive.tar.gz https://github.com/Avafly/PaddleOCR-ncnn-CPP/releases/download/v0.0.3/archive.tar.gz
tar -xzf archive.tar.gz
```

Copy model files to `models/` directory:
```
models/
├── config.json
├── det.bin -> PP-OCRv5_mobile_det.bin (or symlink)
├── det.param -> PP-OCRv5_mobile_det.param
├── cls.bin -> ch_ppocr_mobile_v2.0_cls_infer.bin
├── cls.param -> ch_ppocr_mobile_v2.0_cls_infer.param
├── rec.bin -> PP-OCRv5_mobile_rec.bin
├── rec.param -> PP-OCRv5_mobile_rec.param
└── keys.txt -> ppocr_keys_v5.txt
```

```javascript
const { PaddleOCR, createOCR } = require('paddle-ocr-ncnn');

// Create and initialize
const ocr = new PaddleOCR();
ocr.init('./models/config.json');

// Detect text in an image file
const results = ocr.detect('./path/to/image.png');

// Or detect from a buffer
const fs = require('fs');
const imageBuffer = fs.readFileSync('./path/to/image.png');
const results2 = ocr.detectBuffer(imageBuffer);

// Process results
results.forEach(result => {
    console.log('Text:', result.text);
    console.log('Confidence:', result.boxScore);
    console.log('Bounding box:', result.box);
});
```

### With TypeScript

```typescript
import { PaddleOCR, OCRResult, Point } from 'paddle-ocr-ncnn';

const ocr = new PaddleOCR();
ocr.init('./models/config.json');

const results: OCRResult[] = ocr.detect('./image.png');

for (const result of results) {
    console.log(result.text);  // Recognized text
    console.log(result.box);   // Point[] - 4 corner points
    console.log(result.boxScore);  // Detection confidence
    console.log(result.angle.isRotated);  // Whether text is rotated 180°
}
```

## API Reference

### Class: PaddleOCR

#### `constructor()`
Creates a new PaddleOCR instance.

#### `init(configPath: string): boolean`
Initializes the OCR engine with a configuration file.
- `configPath` - Path to the config.json file
- Returns `true` if initialization was successful

#### `detect(imagePath: string): OCRResult[]`
Detects and recognizes text in an image file.
- `imagePath` - Path to the image file
- Returns array of OCR results

#### `detectBuffer(buffer: Buffer): OCRResult[]`
Detects and recognizes text in an image buffer.
- `buffer` - Image data as a Buffer (PNG, JPEG, etc.)
- Returns array of OCR results

#### `isInitialized: boolean`
Read-only property indicating whether the engine is initialized.

### Interface: OCRResult

```typescript
interface OCRResult {
    text: string;           // Recognized text
    charScores: number[];   // Confidence for each character
    box: Point[];           // 4 corner points of bounding box
    boxScore: number;       // Detection confidence (0-1)
    angle: {
        isRotated: boolean; // True if text is rotated 180°
        score: number;      // Angle detection confidence
    };
}

interface Point {
    x: number;
    y: number;
}
```

## Configuration

The `config.json` file controls the OCR engine behavior:

```json
{
    "save": false,
    "det": {
        "infer_threads": -1,
        "model_path": "./models/det",
        "padding": 0,
        "max_side_len": 768,
        "box_thres": 0.5,
        "bitmap_thres": 0.3,
        "unclip_ratio": 2.0,
        "fp16": false
    },
    "cls": {
        "infer_threads": 1,
        "reco_threads": -1,
        "model_path": "./models/cls",
        "enable": true,
        "most_angle": true,
        "fp16": false
    },
    "rec": {
        "infer_threads": 1,
        "reco_threads": -1,
        "model_path": "./models/rec",
        "keys_path": "./models/keys.txt",
        "fp16": false
    }
}
```

### Options

- `infer_threads`: Number of threads for inference (-1 for auto)
- `max_side_len`: Maximum side length of input image (for detection)
- `box_thres`: Threshold for text box detection
- `bitmap_thres`: Threshold for binarization
- `unclip_ratio`: Ratio for expanding detected boxes
- `fp16`: Enable FP16 inference (faster on supported hardware)
- `enable` (cls): Enable angle classification
- `most_angle` (cls): Use majority voting for angle

## License

MIT

## Credits

Based on [PaddleOCR-ncnn-CPP](https://github.com/Avafly/PaddleOCR-ncnn-CPP) by Avafly.
