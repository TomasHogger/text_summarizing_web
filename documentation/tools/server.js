const path = require('path');
const express = require('express')

const port = process.argv[2];
const htmlDir = process.argv[3];
const pdfPath = process.argv[4];

if (!port || !htmlDir || !pdfPath) {
    console.error('Usage: node server.js <port> <html-file-path> <pdf-file-path>');
    process.exit(1);
}

const absoluteHtmlPath = path.resolve(htmlDir);
const absolutePdfPath = path.resolve(pdfPath);

const app = express();

app.use(express.static(absoluteHtmlPath))

app.get('/pdf', (req, res) => {
    res.sendFile(absolutePdfPath)
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})