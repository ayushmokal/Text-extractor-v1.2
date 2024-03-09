const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });

const visionClient = new vision.ImageAnnotatorClient();
const speechClient = new speech.SpeechClient();

app.use(express.static('.'));

// OCR: Image to Text
app.post('/upload-image', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    try {
        const [result] = await visionClient.textDetection(req.file.path);
        const detections = result.textAnnotations;
        console.log('Text:', detections[0]?.description);
        res.send(detections[0]?.description || "No text detected.");
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image: ' + error.message);
    }
});

// Speech-to-Text: Audio to Text
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No audio file uploaded.');
    }
    console.log("Received audio file:", req.file.originalname);
    const audioBytes = fs.readFileSync(req.file.path).toString('base64');

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const encodingMap = {
        'mp3': 'MP3',
        'wav': 'LINEAR16',
        'ogg': 'OGG_OPUS',
        'opus': 'OGG_OPUS',
        'webm': 'OGG_OPUS'
    };

    const encoding = encodingMap[fileExtension] || null;

    if (!encoding) {
        console.log(`Unsupported file extension for audio file: ${fileExtension}`);
        return res.status(400).send(`Unsupported file type: ${fileExtension}`);
    }

    const config = {
        encoding: encoding,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
    };

    const audio = {
        content: audioBytes,
    };

    const request = {
        audio: audio,
        config: config,
    };

    try {
        const [operation] = await speechClient.longRunningRecognize(request);
        const [response] = await operation.promise();
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        console.log("Transcription:", transcription);
        res.send(transcription || "No transcription available.");
    } catch (error) {
        console.error('Error processing audio file:', error);
        res.status(500).send(`Error processing audio file: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
