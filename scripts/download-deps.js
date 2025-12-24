/**
 * Download pre-built ncnn and OpenCV libraries
 * Supports: macOS (arm64, x64), Linux (x64), Windows (x64)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const DEPS_DIR = path.join(__dirname, '..', 'deps');

// ncnn releases with Vulkan support
const NCNN_VERSION = '20241226';
const NCNN_RELEASES = {
    'darwin-arm64': `https://github.com/Tencent/ncnn/releases/download/${NCNN_VERSION}/ncnn-${NCNN_VERSION}-macos-vulkan.zip`,
    'darwin-x64': `https://github.com/Tencent/ncnn/releases/download/${NCNN_VERSION}/ncnn-${NCNN_VERSION}-macos-vulkan.zip`,
    'linux-x64': `https://github.com/Tencent/ncnn/releases/download/${NCNN_VERSION}/ncnn-${NCNN_VERSION}-ubuntu-2204-vulkan.zip`,
    'win32-x64': `https://github.com/Tencent/ncnn/releases/download/${NCNN_VERSION}/ncnn-${NCNN_VERSION}-windows-vs2022.zip`,
};

// OpenCV releases
const OPENCV_VERSION = '4.12.0';
const OPENCV_RELEASES = {
    'darwin-arm64': null, // Use brew install opencv
    'darwin-x64': null,   // Use brew install opencv
    'linux-x64': null,    // Use apt install libopencv-dev
    'win32-x64': `https://github.com/opencv/opencv/releases/download/${OPENCV_VERSION}/opencv-${OPENCV_VERSION}-windows.exe`,
};

function getPlatformKey() {
    return `${process.platform}-${process.arch}`;
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading: ${url}`);

        const file = fs.createWriteStream(dest);

        const request = (url) => {
            https.get(url, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Follow redirect
                    request(response.headers.location);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                const total = parseInt(response.headers['content-length'], 10);
                let downloaded = 0;

                response.on('data', (chunk) => {
                    downloaded += chunk.length;
                    const percent = ((downloaded / total) * 100).toFixed(1);
                    process.stdout.write(`\rProgress: ${percent}%`);
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log('\nDownload complete.');
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
        };

        request(url);
    });
}

function extractZip(zipPath, destDir) {
    console.log(`Extracting: ${zipPath}`);

    if (process.platform === 'win32') {
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
    } else {
        execSync(`unzip -o -q "${zipPath}" -d "${destDir}"`);
    }

    // Clean up zip file
    fs.unlinkSync(zipPath);
    console.log('Extraction complete.');
}

async function downloadDeps() {
    const platformKey = getPlatformKey();
    console.log(`Platform: ${platformKey}`);

    // Check if platform is supported
    if (!NCNN_RELEASES[platformKey]) {
        console.error(`Unsupported platform: ${platformKey}`);
        console.error('Supported platforms: ' + Object.keys(NCNN_RELEASES).join(', '));
        process.exit(1);
    }

    // Create deps directory
    if (!fs.existsSync(DEPS_DIR)) {
        fs.mkdirSync(DEPS_DIR, { recursive: true });
    }

    const ncnnDir = path.join(DEPS_DIR, 'ncnn');
    const opencvDir = path.join(DEPS_DIR, 'opencv');

    // Download ncnn if not exists
    if (!fs.existsSync(ncnnDir)) {
        const ncnnUrl = NCNN_RELEASES[platformKey];
        const ncnnZip = path.join(DEPS_DIR, 'ncnn.zip');

        try {
            await downloadFile(ncnnUrl, ncnnZip);
            extractZip(ncnnZip, DEPS_DIR);

            // Rename extracted folder to 'ncnn'
            const extractedDirs = fs.readdirSync(DEPS_DIR).filter(d =>
                d.startsWith('ncnn-') && fs.statSync(path.join(DEPS_DIR, d)).isDirectory()
            );
            if (extractedDirs.length > 0) {
                fs.renameSync(path.join(DEPS_DIR, extractedDirs[0]), ncnnDir);
            }
            console.log('ncnn downloaded successfully.');
        } catch (err) {
            console.error('Failed to download ncnn:', err.message);
            console.log('\nPlease manually download ncnn with Vulkan support from:');
            console.log(ncnnUrl);
            console.log(`And extract to: ${ncnnDir}`);
        }
    } else {
        console.log('ncnn already exists, skipping download.');
    }

    // Download OpenCV if not exists
    if (!fs.existsSync(opencvDir)) {
        const opencvUrl = OPENCV_RELEASES[platformKey];

        if (opencvUrl && process.platform === 'win32') {
            // Windows: Download and extract self-extracting exe
            const opencvExe = path.join(DEPS_DIR, 'opencv.exe');

            try {
                await downloadFile(opencvUrl, opencvExe);
                console.log('Extracting OpenCV (this may take a while)...');

                // Run the self-extracting exe silently to deps folder
                execSync(`"${opencvExe}" -o"${DEPS_DIR}" -y`, { stdio: 'inherit' });

                // Clean up exe
                fs.unlinkSync(opencvExe);

                // Rename extracted folder to 'opencv'
                const extractedDirs = fs.readdirSync(DEPS_DIR).filter(d =>
                    d.startsWith('opencv') && d !== 'opencv' && fs.statSync(path.join(DEPS_DIR, d)).isDirectory()
                );
                if (extractedDirs.length > 0) {
                    fs.renameSync(path.join(DEPS_DIR, extractedDirs[0]), opencvDir);
                }

                console.log('OpenCV downloaded successfully.');
                console.log(`OpenCV installed to: ${opencvDir}`);
            } catch (err) {
                console.error('Failed to download OpenCV:', err.message);
                console.log('\nPlease manually download OpenCV from:');
                console.log('https://opencv.org/releases/');
                console.log(`And extract to: ${opencvDir}`);
            }
        } else {
            console.log('\nOpenCV needs to be installed via system package manager:');
            console.log('On macOS: brew install opencv');
            console.log('On Ubuntu: sudo apt-get install libopencv-dev');
            console.log('');
            console.log('Alternatively, set OPENCV_DIR environment variable to your OpenCV installation.');
        }
    } else {
        console.log('OpenCV already exists, skipping download.');
    }
}

// Export for use as module
module.exports = downloadDeps;

// Run directly if called as script
if (require.main === module) {
    downloadDeps().catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
}
