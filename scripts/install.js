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

async function buildFromSource() {
    console.log('Building from source...');

    // Download dependencies
    console.log('Downloading dependencies...');
    const downloadDeps = require('./download-deps.js');
    await downloadDeps();

    // Build with node-gyp
    console.log('Compiling native addon...');

    // Find node-gyp: try local, then hoisted, then global
    const ext = process.platform === 'win32' ? '.cmd' : '';
    const possiblePaths = [
        path.join(rootDir, 'node_modules', '.bin', 'node-gyp' + ext),
        // When installed as dependency, npm may hoist to parent node_modules
        path.join(rootDir, '..', '.bin', 'node-gyp' + ext),
    ];

    let nodeGypCmd = 'node-gyp'; // fallback to global
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            nodeGypCmd = `"${p}"`;
            break;
        }
    }

    const msvs_version = process.platform === 'win32' ? ' --msvs_version=2022' : '';
    execSync(`${nodeGypCmd} rebuild${msvs_version}`, {
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
    await buildFromSource();
}

main().catch(err => {
    console.error('Installation failed:', err.message);
    process.exit(1);
});
