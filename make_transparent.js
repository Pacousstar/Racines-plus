const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processImage(inputPath, outputPath, isIcon = false) {
    try {
        const { data, info } = await sharp(inputPath)
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true });

        // Iterate over pixels to remove white or near-white background
        // Assuming RGBA (4 channels)
        const threshold = 235; // Pixels > 235 on R, G, B will be made transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (r >= threshold && g >= threshold && b >= threshold) {
                // Set alpha to 0 (transparent)
                data[i + 3] = 0;
            }
        }

        let pipeline = sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        });

        if (isIcon) {
            // Resize for icon
            pipeline = pipeline.resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
        }

        await pipeline.png().toFile(outputPath);
        console.log(`Processed: ${outputPath}`);
    } catch (err) {
        console.error('Error processing image', err);
    }
}

async function run() {
    const pubDir = path.join(__dirname, 'public');
    const appDir = path.join(__dirname, 'src', 'app');

    // We update both logos if they exist
    for (const file of fs.readdirSync(pubDir)) {
        if (file.toLowerCase().includes('logo') && file.endsWith('.png')) {
            const inPath = path.join(pubDir, file);
            await processImage(inPath, inPath); // overwrite
        }
    }

    // Create new icon.png for App Router
    const sourcePath = path.join(pubDir, 'LOGO_Racines.png');
    if (fs.existsSync(sourcePath)) {
        const iconPath = path.join(appDir, 'icon.png');
        await processImage(sourcePath, iconPath, true);

        // Remove old favicon.ico if it exists
        const faviconPath = path.join(appDir, 'favicon.ico');
        if (fs.existsSync(faviconPath)) {
            fs.unlinkSync(faviconPath);
            console.log('Removed old favicon.ico');
        }
    }
}

run();
