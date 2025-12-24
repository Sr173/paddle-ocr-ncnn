/**
 * Smart install script that:
 * 1. Tries to download prebuilt binaries
 * 2. Falls back to building from source
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

function tryPrebuildInstall() {
    console.log('Attempting to download prebuilt binary...');

    try {
        // Check if prebuild-install is available
        const prebuildInstallPath = path.join(rootDir, 'node_modules', '.bin', 'prebuild-install');
        const cmd = process.platform === 'win32' ? `"${prebuildInstallPath}.cmd"` : prebuildInstallPath;

        if (!fs.existsSync(prebuildInstallPath) && !fs.existsSync(prebuildInstallPath + '.cmd')) {
            console.log('prebuild-install not found, will build from source.');
            return false;
        }

        const result = spawnSync(cmd, [], {
            cwd: rootDir,
            stdio: 'inherit',
            shell: true
        });

        if (result.status === 0) {
            console.log('Prebuilt binary installed successfully!');
            return true;
        }
    } catch (e) {
        console.log('Could not install prebuilt binary:', e.message);
    }

    return false;
}

function buildFromSource() {
    console.log('Building from source...');

    // Download dependencies
    console.log('Downloading dependencies...');
    require('./download-deps.js');

    // Build with node-gyp
    console.log('Compiling native addon...');
    execSync('node-gyp rebuild', {
        cwd: rootDir,
        stdio: 'inherit'
    });
}

async function main() {
    // First try prebuilt
    if (tryPrebuildInstall()) {
        return;
    }

    // Fall back to building from source
    buildFromSource();
}

main().catch(err => {
    console.error('Installation failed:', err.message);
    process.exit(1);
});
