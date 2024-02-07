const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function sendRequest(mediaType, filePath, model, serverAddress) {
    if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath);
        return;
    }

    const form = new FormData();
    form.append(mediaType, fs.createReadStream(filePath));
    form.append('model', model);

    try {
        const response = await axios.post(`http://${serverAddress}/${mediaType}`, form, {
            headers: form.getHeaders(),
            responseType: 'stream'
        });

        const outputFilename = `output_${path.basename(filePath)}`;
        const writer = fs.createWriteStream(outputFilename);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error in processing request:', error.message);
    }
}

async function main() {
    const [,, mediaType, filePath, model, serverAddress] = process.argv;

    if (!mediaType || !filePath || !model || !serverAddress) {
        console.log('Usage: node uclient.js <image/video> <path/to/file> <model> <ip:port>');
        return;
    }

    if (!['image', 'video'].includes(mediaType)) {
        console.error('Invalid media type. Choose "image" or "video".');
        return;
    }

    console.log(`Sending request to upscale ${mediaType}...`);
    await sendRequest(mediaType, filePath, model, serverAddress);
    console.log(`Upscaled ${mediaType} saved to output.`);
}

main().catch(err => console.error('Error:', err));
