const tf = require('@tensorflow/tfjs-node');
const Upscaler = require('upscaler/node');
const fs = require('fs');
const path = require('path');

// Model import
const x2 = require('@upscalerjs/esrgan-thick/2x');
const x3 = require('@upscalerjs/esrgan-thick/3x');
const x4 = require('@upscalerjs/esrgan-thick/4x');
const x2s = require('@upscalerjs/esrgan-slim/2x');
const x3s = require('@upscalerjs/esrgan-slim/3x');
const x4s = require('@upscalerjs/esrgan-slim/4x');

async function getModel(modelName) {
    switch (modelName) {
        case 'x2':
            return x2;
        case 'x3':
            return x3;
        case 'x4':
            return x4;
        case 'x2s':
            return x2s;
        case 'x3s':
            return x3s;
        case 'x4s':
            return x4s;
        default:
            throw new Error('Invalid model name');
    }
}

async function upscaleImage(modelName, inputImagePath, outputImagePath) {
    const model = await getModel(modelName);
    const upscaler = new Upscaler({ model: model });

    const imageBuffer = fs.readFileSync(inputImagePath);
    console.log(`Upscaling: ${inputImagePath}`);
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);
    const upscaledTensor = await upscaler.upscale(imageTensor, { output: 'tensor' });

    // Encode the tensor to PNG and save
    const upscaledBuffer = await tf.node.encodePng(upscaledTensor);
    fs.writeFileSync(outputImagePath, upscaledBuffer);

    // Dispose tensors to free memory
    imageTensor.dispose();
    upscaledTensor.dispose();
}

async function upscaleDir(directoryPath, modelName) {
    const model = await getModel(modelName);
    const upscaler = new Upscaler({ model: model });

    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        if (fs.lstatSync(filePath).isFile() && file.endsWith('.png')) {
            // Using the same file path for input and output to replace the original image
            await upscaleSingleImage(upscaler, filePath, filePath);
        }
    }
}


// Slightly modified upscaleImage for use within upscaleDir
async function upscaleSingleImage(upscaler, inputImagePath, outputImagePath) {
    const imageBuffer = fs.readFileSync(inputImagePath);
    console.log(`Upscaling: ${inputImagePath}`);
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);
    const upscaledTensor = await upscaler.upscale(imageTensor, { output: 'tensor' });

    // Encode the tensor to PNG and save
    const upscaledBuffer = await tf.node.encodePng(upscaledTensor);
    fs.writeFileSync(outputImagePath, upscaledBuffer);
    // Dispose tensors to free memory
    imageTensor.dispose();
    upscaledTensor.dispose();
}

module.exports = { upscaleImage, upscaleDir };
