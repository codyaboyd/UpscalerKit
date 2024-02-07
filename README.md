# UpscalerKit
Node.js implementation of image/video AI upscaling via API or CLI.

# Installation
*Make sure FFMPEG is installed!*
npm install

# CLI Usage
node cli.js or node cli.js --help or node cli.js -h

# API Usage
*Starts server on port 3000*
node api.js

*Remote CLI Client*
node uclient.js

# Compile uclient.js to portable binary
npx pkg uclient.js -t node18-arm64/x64-macos/windows/linux
