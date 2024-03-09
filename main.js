const unit = 20;
const width = 800;
const height = 800;
const cols = width / unit;
const rows = height / unit;

let paused = true;

let grid = undefined;
let drawingGrid = undefined;
let clipboard = undefined;
let savedGrids = [];
let savedImages = [];

let frame = 0;
const nextState = [
  [0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 0],
];

const mainGrid = function (sketch) {
  sketch.setup = () => {
    const resBtn = sketch.createButton("Resume");
    resBtn.position(10, 820);
    resBtn.mousePressed(() => {
      paused = !paused;
      resBtn.html(paused ? "Resume" : "Pause");
    });

    const clearBtn = sketch.createButton("Clear");
    clearBtn.position(80, 820);
    clearBtn.mousePressed(() => {
      grid = createGrid(cols, rows);
    });

    // const fpsSlider = sketch.createSlider(1, 60, 10);
    // fpsSlider.position(10, 850);
    // fpsSlider.input(() => {
    //   frameRate(fpsSlider.value());
    // });

    sketch.createCanvas(width, height);
    grid = createGrid(cols, rows);
  };

  sketch.draw = () => {
    if (!paused && sketch.frameCount % 6 === 0) updateGrid();

    sketch.background(0);
    const mX = sketch.floor(sketch.mouseX / unit);
    const mY = sketch.floor(sketch.mouseY / unit);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        sketch.stroke(255);
        sketch.fill(grid[i][j] ? 100 : 200);
        if (clipboard?.[i - mX]?.[j - mY]) sketch.fill(sketch.color(255, 0, 0));
        sketch.square(i * unit, j * unit, unit);
      }
    }
  };

  sketch.mousePressed = () => {
    const x = sketch.floor(sketch.mouseX / unit);
    const y = sketch.floor(sketch.mouseY / unit);
    if (x < 0 || x > cols - 1 || y < 0 || y > rows - 1) return;
    if (!clipboard) {
      grid[x][y] = !grid[x][y] + 0;
      return;
    }
    for (let i = 0; i < clipboard.length; i++) {
      for (let j = 0; j < clipboard[i].length; j++) {
        if (clipboard[i][j]) {
          grid[x + i][y + j] = 1;
        }
      }
    }
  };
};

const drawingBoard = function (sketch) {
  sketch.setup = () => {
    let cnv = sketch.createCanvas(300, 800);
    cnv.position(850, 10);
    drawingGrid = createGrid(15, 15);

    const copyBtn = sketch.createButton("Copy");
    copyBtn.position(850, 320);
    copyBtn.mousePressed(() => {
      clipboard = JSON.parse(JSON.stringify(drawingGrid));
      while (true) {
        if (clipboard[0].every((v) => v === 0)) clipboard.splice(0, 1);
        else break;
      }
      while (true) {
        if (clipboard.every((v) => v[0] === 0))
          clipboard.forEach((v) => v.splice(0, 1));
        else break;
      }
    });

    const clearBtn = sketch.createButton("Clear");
    clearBtn.position(910, 320);
    clearBtn.mousePressed(() => {
      drawingGrid = createGrid(15, 15);
    });

    const clearClipboardBtn = sketch.createButton("Clear Clipboard");
    clearClipboardBtn.position(850, 350);
    clearClipboardBtn.mousePressed(() => {
      clipboard = undefined;
    });

    let info = sketch.createP("Click to copy, right click to delete");
    info.position(850, 360);

    const saveBtn = sketch.createButton("Save");
    saveBtn.position(1050, 320);
    saveBtn.mousePressed(() => {
      const cp = trimGrid(drawingGrid);
      const size = sketch.max(cp.length, cp[0].length);
      const img = sketch.createImage(size, size);
      img.loadPixels();
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          img.set(i, j, sketch.color(cp[i]?.[j] ? 0 : 200));
        }
      }
      img.updatePixels();
      savedImages.push(img);
      savedGrids.push(cp);
    });
  };

  sketch.draw = () => {
    sketch.background(255);
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        sketch.stroke(255);
        sketch.fill(drawingGrid[i][j] ? 100 : 200);
        sketch.square(i * unit, j * unit, unit);
      }
    }

    for (let i = 0; i < savedImages.length; i++) {
      sketch.noSmooth();
      savedImages[i].loadPixels();
      sketch.image(
        savedImages[i],
        (i % 2) * 200,
        400 + 110 * parseInt(i / 2),
        100,
        100
      );
    }
  };

  sketch.mousePressed = () => {
    const x = sketch.floor(sketch.mouseX / unit);
    const y = sketch.floor(sketch.mouseY / unit);
    if (!(x < 0 || x > 14 || y < 0 || y > 14))
      drawingGrid[x][y] = !drawingGrid[x][y] + 0;
    else {
      if (sketch.mouseY < 400) return;
      const idx =
        parseInt((sketch.mouseY - 400) / 110) * 2 +
        parseInt(sketch.mouseX / 200);
      if (idx >= 0 && idx < savedImages.length) {
        if (sketch.mouseButton === sketch.RIGHT) {
          savedImages.splice(idx, 1);
          savedGrids.splice(idx, 1);
        } else clipboard = JSON.parse(JSON.stringify(savedGrids[idx]));
      }
    }
  };
};

document.oncontextmenu = function () {
  return false;
};

const mainP5 = new p5(mainGrid);
const drawingP5 = new p5(drawingBoard);

function createGrid(x, y) {
  const grid = new Array(x);
  for (let i = 0; i < x; i++) {
    grid[i] = new Array(y);
    for (let j = 0; j < y; j++) {
      grid[i][j] = 0;
    }
  }
  return grid;
}

function updateGrid() {
  const newGrid = createGrid(cols, rows);

  for (let i = 1; i < cols - 1; i++) {
    for (let j = 1; j < rows - 1; j++) {
      const total = getNeighbours(i, j);
      try {
        newGrid[i][j] = nextState[grid[i][j]][total];
        if (newGrid[i][j] == undefined) throw "e";
      } catch (error) {
        console.log(j + "-" + i);
        console.log(total);
        console.log(grid[i][j]);
        throw error;
      }
    }
  }
  grid = newGrid;
  frame++;
  console.log(frame);
}

function mousePressed() {
  const x = floor(mouseX / unit);
  const y = floor(mouseY / unit);
  grid[x][y] = !grid[x][y] + 0;
  console.log(x + "-" + y);
}

function mouseDragged() {
  mousePressed();
}

function getNeighbours(x, y) {
  let total = 0;
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (!i && !j) continue;
      total += grid[x + i][y + j];
    }
  }
  if (total == undefined) console.log(x + "-" + y);
  return total;
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function trimGrid(grid) {
  let cp = JSON.parse(JSON.stringify(grid));
  while (true) {
    if (cp[0].every((v) => v === 0)) cp.splice(0, 1);
    else break;
  }
  while (true) {
    if (cp.every((v) => v[0] === 0)) cp.forEach((v) => v.splice(0, 1));
    else break;
  }
  while (true) {
    if (cp[cp.length - 1].every((v) => v === 0)) cp.splice(cp.length - 1, 1);
    else break;
  }
  while (true) {
    if (cp.every((v) => v[v.length - 1] === 0))
      cp.forEach((v) => v.splice(v.length - 1, 1));
    else break;
  }
  return cp;
}
