document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files');
    const previewContainer = document.getElementById('preview-container');
    const controlsContainer = document.getElementById('controls-container');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    
    // Store processed images
    const processedImages = [];
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle selected files
    fileInput.addEventListener('change', handleFiles, false);
    
    // Handle select files button
    selectFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle download all button
    downloadAllBtn.addEventListener('click', downloadAllImages);
    
    // Handle clear all button
    clearAllBtn.addEventListener('click', clearAllImages);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }
    
    function handleFiles(e) {
        const files = Array.from(e.target.files);
        
        if (files.length > 0) {
            controlsContainer.style.display = 'block';
        }
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                processImage(file);
            }
        });
    }
    
    function processImage(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Create canvas for resizing
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                
                // Draw image on canvas with proper scaling
                ctx.drawImage(img, 0, 0, 64, 64);
                
                // Convert to JPEG with 100% quality
                const resizedImageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
                
                // Get file size of the resized image
                const base64String = resizedImageDataUrl.split(',')[1];
                const fileSize = Math.round((base64String.length * 3) / 4);
                
                // Store the processed image data
                const imageData = {
                    name: file.name.replace(/\.[^/.]+$/, '') + '_64x64.jpg',
                    dataUrl: resizedImageDataUrl
                };
                processedImages.push(imageData);
                
                // Create preview item
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                // Create remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = '×';
                removeBtn.addEventListener('click', () => {
                    removeImage(previewItem, imageData);
                });
                previewItem.appendChild(removeBtn);
                
                // Create preview image
                const previewImage = document.createElement('img');
                previewImage.src = resizedImageDataUrl;
                previewImage.className = 'preview-image';
                previewItem.appendChild(previewImage);
                
                // Create info text
                const infoText = document.createElement('div');
                infoText.className = 'preview-info';
                infoText.textContent = `${file.name}
                Original: ${formatFileSize(file.size)}
                Resized: ${formatFileSize(fileSize)}`;
                previewItem.appendChild(infoText);
                
                // Create download button
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.textContent = 'Download';
                downloadBtn.addEventListener('click', () => {
                    downloadImage(resizedImageDataUrl, imageData.name);
                });
                previewItem.appendChild(downloadBtn);
                
                // Add to preview container
                previewContainer.appendChild(previewItem);
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    function removeImage(previewItem, imageData) {
        // Remove from DOM
        previewContainer.removeChild(previewItem);
        
        // Remove from processed images
        const index = processedImages.indexOf(imageData);
        if (index > -1) {
            processedImages.splice(index, 1);
        }
        
        // Hide controls if no images left
        if (processedImages.length === 0) {
            controlsContainer.style.display = 'none';
        }
    }
    
    function clearAllImages() {
        // Clear preview container
        while (previewContainer.firstChild) {
            previewContainer.removeChild(previewContainer.firstChild);
        }
        
        // Clear processed images array
        processedImages.length = 0;
        
        // Hide controls
        controlsContainer.style.display = 'none';
    }
    
    function downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
    }
    
    function downloadAllImages() {
        if (processedImages.length === 0) return;
        
        // If only one image, download it directly
        if (processedImages.length === 1) {
            downloadImage(processedImages[0].dataUrl, processedImages[0].name);
            return;
        }
        
        // For multiple images, create a zip file
        const zip = new JSZip();
        
        processedImages.forEach((image) => {
            // Convert base64 to binary
            const base64Data = image.dataUrl.split(',')[1];
            const binaryData = atob(base64Data);
            
            // Convert binary to array buffer
            const arrayBuffer = new ArrayBuffer(binaryData.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < binaryData.length; i++) {
                uint8Array[i] = binaryData.charCodeAt(i);
            }
            
            // Add to zip
            zip.file(image.name, uint8Array);
        });
        
        // Generate and download zip
        zip.generateAsync({ type: 'blob' }).then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'teamspeak_icons_64x64.zip';
            link.click();
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
});
