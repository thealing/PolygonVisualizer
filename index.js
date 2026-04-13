init();

function init() {
  widthInput = document.getElementById("width-input");
  heightInput = document.getElementById("height-input");
  marginInput = document.getElementById("margin-input");
  undoButton = document.getElementById("undo-button");
  clearButton = document.getElementById("clear-button");
  pointsInput = document.getElementById("points-input");
  pointsLabel = document.getElementById("points-label");
  diagonalsLabel = document.getElementById("diagonals-label");
  proximityInput = document.getElementById("proximity-input");
  generateButton = document.getElementById("generate-button");
  triangulateButton = document.getElementById("triangulate-button");
  decomposeButton = document.getElementById("decompose-button");
  displayCanvas = document.getElementById("display-canvas");
  displayContext = displayCanvas.getContext("2d");
  const displayRect = displayCanvas.getBoundingClientRect();
  widthInput.value = displayRect.width;
  heightInput.value = displayRect.height;
  polygonPoints = [];
  polygonFinished = false;
  decomposition = [];
  targetRadius = window.devicePixelRatio * 10;
  undoButton.addEventListener("click", function() {
    if (polygonFinished) {
      polygonFinished = false;
      decomposition = [];
      return;
    }
    polygonPoints.pop()
    pointsLabel.textContent = polygonPoints.length;
  });
  clearButton.addEventListener("click", function() {
    polygonFinished = false;
    polygonPoints = [];
    decomposition = [];
    pointsLabel.textContent = polygonPoints.length;
  });
  generateButton.addEventListener("click", function() {
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    const margin = parseInt(marginInput.value);
    polygonPoints = generateRandomPolygon(pointsInput.value, proximityInput.value, margin, margin, width - margin, height - margin);
    pointsLabel.textContent = polygonPoints.length;
    polygonFinished = true;
    decomposition = [];
  });
  triangulateButton.addEventListener("click", function() {
    if (!polygonFinished) {
      return;
    }
    var fixedPoints = fixPolygon(polygonPoints);
    decomposition = triangulatePolygon(fixedPoints);
    if (fixedPoints != polygonPoints) {
      for (var polygon of decomposition) {
        for (var i = 0; i < polygon.length; i++) {
          polygon[i] = fixedPoints.length - 1 - polygon[i];
        }
      }
    }
  });
  decomposeButton.addEventListener("click", function() {
    if (!polygonFinished) {
      return;
    }
    var fixedPoints = fixPolygon(polygonPoints);
    decomposition = decomposePolygon(fixedPoints);
    if (fixedPoints != polygonPoints) {
      for (var polygon of decomposition) {
        for (var i = 0; i < polygon.length; i++) {
          polygon[i] = fixedPoints.length - 1 - polygon[i];
        }
      }
    }
  });
  displayCanvas.addEventListener("mouseup", function(event) {
    if (polygonFinished) {
      return;
    }
    const rect = displayCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * displayCanvas.width / rect.width;
    const y = (event.clientY - rect.top) * displayCanvas.height / rect.height;
    const r = targetRadius;
    if (polygonPoints.length > 0 && (x - polygonPoints[0].x) ** 2 + (y - polygonPoints[0].y) ** 2 < r ** 2) {
      polygonFinished = true;
      return;
    }
    if (polygonPoints.length > 0 && (x - polygonPoints[polygonPoints.length - 1].x) ** 2 + (y - polygonPoints[polygonPoints.length - 1].y) ** 2 < r ** 2) {
      return;
    }
    polygonPoints.push({ x: x, y: y });
  });
  requestAnimationFrame(animate);
}

function animate() {
  let diagonalCount = 0;
  displayCanvas.width = parseInt(widthInput.value);
  displayCanvas.height = parseInt(heightInput.value);
  displayContext.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
  if (polygonPoints.length > 0) {
    displayContext.lineWidth = 1;
    displayContext.strokeStyle = polygonFinished ? "green" : "red";
    displayContext.beginPath();
    displayContext.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      displayContext.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    if (polygonFinished) {
      displayContext.closePath();
    }
    displayContext.stroke();
    displayContext.strokeStyle = "blue";
    displayContext.beginPath();
    for (const polygon of decomposition) {
      for (let i = 0; i < polygon.length; i++) {
        const idx1 = polygon[i];
        const idx2 = polygon[(i + 1) % polygon.length];
        const p1 = polygonPoints[idx1];
        const p2 = polygonPoints[idx2];
        const dist = idx1 - idx2;
        if (dist > 1 && dist < polygonPoints.length - 1) {
          displayContext.moveTo(p1.x, p1.y);
          displayContext.lineTo(p2.x, p2.y);
          diagonalCount++;
        }
      }
    }
    displayContext.stroke();
  }
  pointsLabel.textContent = polygonPoints.length;
  diagonalsLabel.textContent = diagonalCount;
  requestAnimationFrame(animate);
}
