const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
const fs = require('fs');
const path = require('path');

// Setting ffprobe path for fluent-ffmpeg
ffmpeg.setFfprobePath(ffprobe.path);

// unVideo function: Splits video into frames and audio tracks
function unVideo(filePath) {
    return new Promise((resolve, reject) => {
        const videoName = path.basename(filePath, path.extname(filePath));
        const outputDir = path.join(__dirname, `${videoName}_upscaling`);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        ffmpeg.ffprobe(filePath, function(err, metadata) {
            if (err) {
                console.error('Error probing video:', err);
                return reject(err);
            }

            const fps = metadata.streams.find(s => s.codec_type === 'video').avg_frame_rate.split('/').reduce((a, b) => a / b);
            const audioTracks = metadata.streams.filter(s => s.codec_type === 'audio').length;

            fs.writeFileSync(path.join(outputDir, 'fps.txt'), fps.toString());

            let audioExtractCount = 0;

            ffmpeg(filePath)
                .on('end', () => {
                    console.log('Frames extraction completed');
                    if (audioExtractCount === audioTracks) {
                        resolve(); // Resolve when both frames and audio are extracted
                    }
                })
                .on('error', (err) => {
                    console.error('Error:', err);
                    reject(err);
                })
                .output(path.join(outputDir, 'frame-%d.png'))
                .outputOptions(['-vf', `fps=${fps}`])
                .run();

            for (let i = 0; i < audioTracks; i++) {
                ffmpeg(filePath)
                    .on('end', () => {
                        console.log(`Audio track ${i} extraction completed`);
                        audioExtractCount++;
                        if (audioExtractCount === audioTracks) {
                            resolve(); // Resolve when both frames and audio are extracted
                        }
                    })
                    .on('error', (err) => {
                        console.error('Error:', err);
                        reject(err);
                    })
                    .output(path.join(outputDir, `audio_track_${i}.mp3`))
                    .outputOptions(['-map', `0:a:${i}`])
                    .run();
            }
        });
    });
}

function reVideo(folderPath) {
    return new Promise((resolve, reject) => {
        const inputDir = path.join(__dirname, folderPath);
        const fpsTextPath = path.join(inputDir, 'fps.txt');
        const fps = fs.readFileSync(fpsTextPath, 'utf8');
        const outputFilePath = path.join(__dirname, `${folderPath}_reconstructed.mp4`);

        // Create FFmpeg command and add frame input
        const command = ffmpeg()
            .input(path.join(inputDir, 'frame-%d.png'))
            .inputFPS(Number(fps));

        // Manually add each audio track
        const audioFiles = fs.readdirSync(inputDir).filter(file => file.startsWith('audio_track_') && file.endsWith('.mp3'));
        audioFiles.forEach(audioFile => {
            command.addInput(path.join(inputDir, audioFile));
        });

        // Set up event handlers and execute
        command.on('end', () => {
            console.log('Video reassembled successfully');
            resolve();
        }).on('error', (err) => {
            console.error('Error:', err);
            reject(err);
        }).save(outputFilePath);
    });
}

module.exports = { unVideo, reVideo };
