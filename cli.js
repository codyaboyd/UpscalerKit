const fs = require('fs');
const path = require('path');
const { unVideo, reVideo } = require('./videoHandler.js');
const { upscaleImage, upscaleDir } = require('./upscaler.js');

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
    }
}

async function upscaleVideo(videoPath, model) {
    const videoName = path.basename(videoPath, path.extname(videoPath));
    const framesDir = `${videoName}_upscaling`;

    // Split video into frames and audio
    await unVideo(videoPath);

    // Upscale all frames in the directory
    const framesDirectoryPath = path.join(__dirname, framesDir);
    await upscaleDir(framesDirectoryPath, model);

    // Reassemble video
    await reVideo(framesDir);

    // Delete the folder after successful reassembly
    deleteFolderRecursive(framesDirectoryPath);
}

async function main() {
    const [,, firstArg, mediaType, model] = process.argv;

    // Check for help argument or no arguments
    if (!firstArg || ['-h', '--help'].includes(firstArg)) {
        console.log('\nUsage: node cli.js /path/to/media/ mediaType model\n\n' +
                    'mediaType: "image" or "video"\n' +
                    'model: LiteScaling: x2s,x3s,x4s. FullScaling: x2,x3,x4\n\n' +
                    'Example:\n' +
                    'node cli.js ./path/to/video.mp4 video x2s\n' +
                    'node cli.js ./path/to/image.jpg image x4');
        return;
    }

    if (!mediaType || !model) {
        console.log('Missing arguments. Usage: node cli.js /path/to/media/ mediaType model');
        return;
    }

    if (mediaType === 'image') {
        await upscaleImage(model, firstArg, firstArg); // Upscaling in place
    } else if (mediaType === 'video') {
        await upscaleVideo(firstArg, model);
    } else {
        console.log('Invalid media type. Choose "image" or "video".');
    }
}

main().catch(err => console.error('Error:', err));
