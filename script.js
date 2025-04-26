document.addEventListener("DOMContentLoaded", () => {
    // Tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).style.display = 'block';
        });
    });

    // Pixel Art
    const grid = document.getElementById('grid');
    const colorPicker = document.getElementById('colorPicker');
    const colorMode = document.getElementById('colorMode');
    const clearGrid = document.getElementById('clearGrid');
    const resizeGrid = document.getElementById('resizeGrid');
    const imageUpload = document.getElementById('imageUpload');
    const saveCanvas = document.getElementById('saveCanvas');
    const formatSelect = document.getElementById('formatSelect');
    let gridSize = 32;
    let drawing = false;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    function getRandomColor() {
        return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
    }
    function createGrid(size) {
        grid.innerHTML = "";
        grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.style.border = "1px solid rgba(255, 255, 255, 0.2)";
            cell.addEventListener("mousedown", () => { drawing = true; cell.style.backgroundColor = colorMode.checked ? getRandomColor() : colorPicker.value; });
            cell.addEventListener("mouseover", () => { if (drawing) cell.style.backgroundColor = colorMode.checked ? getRandomColor() : colorPicker.value; });
            cell.addEventListener("mouseup", () => { drawing = false; });
            grid.appendChild(cell);
        }
    }
    document.body.addEventListener("mouseup", () => { drawing = false; });
    clearGrid.addEventListener('click', () => {
        Array.from(grid.children).forEach(cell => cell.style.backgroundColor = "");
    });
    resizeGrid.addEventListener('click', () => {
        let newSize = parseInt(prompt("Nuevo tamaño de la cuadrícula (16-100):", gridSize));
        if (!isNaN(newSize) && newSize >= 16 && newSize <= 100) {
            gridSize = newSize;
            createGrid(gridSize);
        }
    });
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new window.Image();
        img.onload = function() {
            createGrid(gridSize);
            // Dibujar imagen en el canvas temporal
            canvas.width = gridSize;
            canvas.height = gridSize;
            ctx.drawImage(img, 0, 0, gridSize, gridSize);
            // Mapear colores a las celdas
            const data = ctx.getImageData(0, 0, gridSize, gridSize).data;
            Array.from(grid.children).forEach((cell, idx) => {
                const x = idx % gridSize;
                const y = Math.floor(idx / gridSize);
                const i = (y * gridSize + x) * 4;
                cell.style.backgroundColor = `rgb(${data[i]},${data[i+1]},${data[i+2]})`;
            });
        };
        img.src = URL.createObjectURL(file);
    });
    saveCanvas.addEventListener('click', () => {
        // Canvas de alta resolución
        const exportSize = 800;
        canvas.width = exportSize;
        canvas.height = exportSize;
        const cellSize = exportSize / gridSize;
        Array.from(grid.children).forEach((cell, idx) => {
            const x = idx % gridSize;
            const y = Math.floor(idx / gridSize);
            ctx.fillStyle = cell.style.backgroundColor || '#fff';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
        const format = formatSelect.value;
        let mime = 'image/png';
        if (format === 'jpeg') mime = 'image/jpeg';
        if (format === 'webp') mime = 'image/webp';
        canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `pixel-art.${format}`;
            a.click();
        }, mime);
    });
    createGrid(gridSize);

    // ASCII Art
    const asciiImageUpload = document.getElementById('asciiImageUpload');
    const asciiOutput = document.getElementById('asciiOutput');
    const asciiStyle = document.getElementById('asciiStyle');
    const copyAscii = document.getElementById('copyAscii');
    const asciiCharCount = document.getElementById('asciiCharCount');
    const asciiCharCountValue = document.getElementById('asciiCharCountValue');
    const asciiContrastSwitch = document.getElementById('asciiContrastSwitch');
    const saveAsciiTxt = document.getElementById('saveAsciiTxt');
    let lastImg = null;
    let lastStyle = asciiStyle.value;
    let lastCharCount = asciiCharCount.value;
    let lastContrast = false;

    function updateAsciiOutput() {
        if (!lastImg) return;
        lastStyle = asciiStyle.value;
        lastCharCount = asciiCharCount.value;
        lastContrast = asciiContrastSwitch.checked;
        asciiOutput.value = imageToAscii(lastImg, lastStyle, lastCharCount, lastContrast);
        if (lastContrast) {
            asciiOutput.style.background = '#222';
            asciiOutput.style.color = '#fff';
        } else {
            asciiOutput.style.background = '#fff';
            asciiOutput.style.color = '#222';
        }
    }

    if (saveAsciiTxt) {
        saveAsciiTxt.addEventListener('click', () => {
            const asciiContent = asciiOutput.value;
            const blob = new Blob([asciiContent], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'ascii_art.txt';
            a.click();
            URL.revokeObjectURL(a.href);
        });
    }

    asciiImageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new window.Image();
            img.onload = function() {
                lastImg = img;
                updateAsciiOutput();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    asciiStyle.addEventListener('change', updateAsciiOutput);
    asciiCharCount.addEventListener('input', () => {
        asciiCharCountValue.textContent = asciiCharCount.value;
        updateAsciiOutput();
    });
    asciiContrastSwitch.addEventListener('change', updateAsciiOutput);

    copyAscii.addEventListener('click', () => {
        asciiOutput.select();
        document.execCommand('copy');
    });
    function imageToAscii(img, style, charCount, invert) {
        let charSets = {
            standard: "@%#*+=-:. ",
            dense: "@#W$9876543210?!abc;:+=-,._ ",
            simple: "@#S%?*+;:,.",
            cruz: "✟✟♰♱ ",
            cuadrados: "█▓▒░ ",
            cruz: "✠✚✟✙✢✧✵✥✺ ",
            asterisco: "✱✸✹✷✲✳✴✵✶ ",
        };
        let chars = charSets[style] || charSets.standard;
        if (invert) chars = chars.split('').reverse().join('');
        let w = parseInt(charCount) || 80;
        let h = Math.round(w * 0.5);
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        let tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, w, h);
        let data = tempCtx.getImageData(0, 0, w, h).data;
        let ascii = '';
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let i = (y * w + x) * 4;
                let avg = (data[i] + data[i+1] + data[i+2]) / 3;
                let charIdx = Math.floor((avg / 255) * (chars.length - 1));
                ascii += chars[charIdx];
            }
            ascii += '\n';
        }
        return ascii;
    }
});
