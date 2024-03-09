document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    imageInput.addEventListener('change', async (e) => {
        uploadFile(e.target.files[0], '/upload-image', 'file'); // Specifying 'file' for images
    });

    const audioInput = document.getElementById('audioInput');
    audioInput.addEventListener('change', async (e) => {
        uploadFile(e.target.files[0], '/upload-audio', 'audio'); // Specifying 'audio' for audio files
    });

    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');

    fontSizeSlider.addEventListener('input', function() {
        const size = this.value;
        fontSizeValue.textContent = size;
        document.getElementById('textOutput').style.fontSize = size + 'px';
    });

    document.getElementById('textColorPicker').addEventListener('change', function() {
        document.getElementById('textOutput').style.color = this.value;
    });

    document.getElementById('fontStyleSelect').addEventListener('change', function() {
        document.getElementById('textOutput').style.fontFamily = this.value;
    });

    document.getElementById('copyTextBtn').addEventListener('click', function() {
        const textToCopy = document.getElementById('textOutput').innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Text copied to clipboard');
        });
    });

    const dropArea = document.getElementById('drop-area');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        ([...files]).forEach(file => {
            // Assuming all dropped files are images as there's no UI element for dropping audio files
            uploadFile(file, '/upload-image', 'file'); // Specifying 'file' for images
        });
    }

    function uploadFile(file, url, fieldName) {
        if (file) {
            const formData = new FormData();
            formData.append(fieldName, file);
            fetch(url, {
                method: 'POST',
                body: formData,
            })
            .then(response => response.ok ? response.text() : Promise.reject(response.statusText))
            .then(data => {
                document.getElementById('textOutput').textContent = data;
                enableDownloadButtons(data);
            })
            .catch(error => console.error('Error:', error));
        }
    }

    function enableDownloadButtons(text) {
        document.getElementById('downloadTxt').addEventListener('click', () => downloadText(text));
        document.getElementById('downloadPdf').addEventListener('click', () => downloadPDF(text));
    }

    function downloadText(text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const fileName = document.getElementById('fileNameInput').value || 'transcription';
        saveAs(blob, `${fileName}.txt`);
    }

    function downloadPDF(text) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(text, 10, 10);
        const fileName = document.getElementById('fileNameInput').value || 'transcription';
        doc.save(`${fileName}.pdf`);
    }
});
