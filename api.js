const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { upscaleImage, upscaleDir } = require('./upscaler.js');
const { unVideo, reVideo } = require('./videoHandler.js');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());

function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
    }
}

app.post('/image', upload.single('image'), async (req, res) => {
    const model = req.body.model;
    if (!model) {
        return res.status(400).send('Model is required');
    }

    const imagePath = req.file.path;
    const outputPath = 'output/' + req.file.filename;
    console.log('Output Path:', outputPath);

    // Directory check and creation
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        console.log('Creating output directory');
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        await upscaleImage(model, imagePath, outputPath);
        res.download(outputPath, () => {
            deleteFile(imagePath);
            deleteFile(outputPath);
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error processing image');
    }
});

app.post('/video', upload.single('video'), async (req, res) => {
    const model = req.body.model;
    if (!model) {
        return res.status(400).send('Model is required');
    }

    const videoPath = req.file.path;
    const videoName = path.basename(videoPath, path.extname(videoPath));
    const framesDir = `${videoName}_upscaling`;

    try {
        await unVideo(videoPath);
        const framesDirectoryPath = path.join(__dirname, framesDir);
        await upscaleDir(framesDirectoryPath, model);
        await reVideo(framesDir);

        // Assuming the output is an .mp4 file
        // Modify this path if reVideo saves the file differently
        const outputPath = path.join(__dirname, `${videoName}_upscaling_reconstructed.mp4`);

        // Check if the output file exists
        if (!fs.existsSync(outputPath)) {
            console.error('Output video file not found:', outputPath);
            return res.status(500).send('Error: Output video file not found');
        }

        res.download(outputPath, () => {
            deleteFile(videoPath);
            deleteFolderRecursive(framesDirectoryPath);
            deleteFile(outputPath);
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error processing video');
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
