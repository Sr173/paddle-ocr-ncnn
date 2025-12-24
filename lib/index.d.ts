/**
 * A point in 2D space
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Angle detection result
 */
export interface AngleInfo {
    /** Whether the text region is rotated 180 degrees */
    isRotated: boolean;
    /** Confidence score of the angle detection */
    score: number;
}

/**
 * OCR detection and recognition result for a single text region
 */
export interface OCRResult {
    /** Recognized text content */
    text: string;
    /** Confidence scores for each recognized character */
    charScores: number[];
    /** Bounding box points (4 corners of the text region) */
    box: Point[];
    /** Confidence score of the text detection */
    boxScore: number;
    /** Angle detection information */
    angle: AngleInfo;
}

/**
 * PaddleOCR engine class
 */
export class PaddleOCR {
    /**
     * Create a new PaddleOCR instance
     */
    constructor();

    /**
     * Initialize the OCR engine with a config file
     * @param configPath - Path to the config.json file
     * @returns True if initialization was successful
     */
    init(configPath: string): boolean;

    /**
     * Detect and recognize text in an image file
     * @param imagePath - Path to the image file
     * @returns Array of detected text regions with recognition results
     */
    detect(imagePath: string): OCRResult[];

    /**
     * Detect and recognize text in an image buffer
     * @param buffer - Image data as a Buffer
     * @returns Array of detected text regions with recognition results
     */
    detectBuffer(buffer: Buffer): OCRResult[];

    /**
     * Check if the engine is initialized
     */
    readonly isInitialized: boolean;
}

/**
 * Create a new PaddleOCR instance
 * @param configPath - Optional config path to auto-initialize
 * @returns PaddleOCR instance
 */
export function createOCR(configPath?: string): PaddleOCR;

/**
 * Raw native binding (for advanced usage)
 */
export const _binding: {
    OCREngine: new () => {
        initialize(configPath: string): boolean;
        detect(imagePath: string): OCRResult[];
        detectBuffer(buffer: Buffer): OCRResult[];
    };
};
