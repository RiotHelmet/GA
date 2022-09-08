// Sätter upp canvasen
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
// lite variabler
let fps;
let fpsInfo = document.getElementById("ui-fps");
let amountDiv = document.getElementById("ui-amount");
let deltaT = 1 / 599;
let scale = 100;
let amountOfObjects = 1;
let friction = 0.995;
let showQuadTree = false;
let mousePos = {
  x: 0,
  y: 0,
};
let currentStyle = "particle";
let showCircle = false;
let CoR = 0.5;
let selectedObject = false;

let particleSlider = document.getElementById("particle-Slider");

let particleAmount = document.getElementById("particle-Amount");

let ropeSlider = document.getElementById("rope-Slider");

let bombSlider = document.getElementById("bomb-Slider");

let clothSlider = document.getElementById("cloth-Slider");

let moveSlider = document.getElementById("move-Slider");

let particleUI = document.getElementById("particleUI");

function updateParticleUI(Object) {
  Object.fixed = document.getElementById("fixedCheckbox").checked;
  Object.currentFixed = Object.fixed;
  Object.solid = document.getElementById("solidCheckbox").checked;

  document.getElementById("particleUI-position").innerHTML = `(${Math.floor(
    Object.pos.x
  )}, ${Math.floor(Object.pos.y)})`;

  document.getElementById("particleUI-velocity").innerHTML = `(${
    Math.floor(Object.velocity.x * 10) / 10
  }, ${Math.floor(Object.velocity.y * 10) / 10})`;

  document.getElementById("particleUI-acc").innerHTML = `(${
    Math.floor(Object.velocity.x * 10) / 10
  }, ${Math.floor(Object.velocity.y * 10) / 10})`;
}

// stänger alla flikar i UI
function clearUI() {
  document.getElementById("particleSlider").style.display = "none";
  document.getElementById("particle-Amount-div").style.display = "none";

  document.getElementById("ropeSlider").style.display = "none";
  document.getElementById("bombSlider").style.display = "none";
  document.getElementById("clothSlider").style.display = "none";
  document.getElementById("moveSlider").style.display = "none";

  document.getElementById("particleButton").style.backgroundColor = "white";
  document.getElementById("ropeButton").style.backgroundColor = "white";
  document.getElementById("bombButton").style.backgroundColor = "white";
  document.getElementById("clothButton").style.backgroundColor = "white";
  document.getElementById("selectButton").style.backgroundColor = "white";
  document.getElementById("moveButton").style.backgroundColor = "white";
}

// Klassen Vector håller ett x värde och ett y värde. Används för saker som positioner eller hastigheter.
class Vector {
  constructor(x, y) {
    (this.x = x), (this.y = y);
  }
  mult(Value) {
    this.x *= Value;
    this.y *= Value;
  }
  add(OtherVector) {
    this.x += OtherVector.x;
    this.y += OtherVector.y;
  }

  sub(OtherVector) {
    this.x -= OtherVector.x;
    this.y -= OtherVector.y;
  }
  equal(OtherVector) {
    (this.x = OtherVector.x), (this.y = OtherVector.y);
  }
  reset() {
    this.x = 0;
    this.y = 0;
  }
}

class cursor {
  constructor() {
    this.radius = 2;
  }

  draw() {
    if (currentStyle == "move") {
      this.radius = moveSlider.value;
    } else if (currentStyle == "particle") {
      this.radius = (particleSlider.value * scale) / 10;
    }
    if (currentStyle == "move" || currentStyle == "particle") {
      ctx.strokeStyle = "red";
      ctx.lineWidth = "2";
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, this.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}
mouseCursor = new cursor();

// Arrays
// Arrayen particles håller alla partiklar. Detta gör så att jag kan uppdatera alla partiklar varje uppdatering genom foreach()
let particles = [];

class particle {
  constructor(x, y, mass, fixed, solid) {
    particles.push(this);
    amountDiv.innerHTML = `Objects: ${amountOfObjects}`;
    amountOfObjects++;
    // Om objektet är under muspekaren
    this.currentlyHovered = false;
    // Positionen
    this.pos = new Vector(x, y);
    // Objektets massa
    this.mass = mass;
    this.velocity = new Vector(0, 0);
    // den gamla positionen, används för att hitta hastigheten (gamla positionen - nya positionen / deltaT)
    this.oldpos = new Vector(x, y);
    // Positionen som Objektet ska sitta fast vid om den är fixed
    this.fixedpos = new Vector(x, y);
    // Accelerationen lägger på sitt värde på hastigheten varje sekund.
    this.acceleration = new Vector(0, 0);
    // solid är om Objekter ska kollidera eller ej
    this.solid = solid;
    // fixed är om objekter ska kunna flytta på sig eller ej. Alltså om det är fast i plats.
    this.fixed = fixed;
    // Anledningen till att finns både en currentFixed och en fixed är för att currentFixed ska kunna ändras tillbaka till sitt normalvärde (fixed)
    this.currentFixed = this.fixed;
    this.color = "black";
    // Objektets radie
    this.radius = (this.mass * scale) / 10;
    deltaT = 1 / fps / 1.5;
  }
  update() {
    if (!this.fixed && currentStyle !== "move") {
      this.fixedpos.equal(this.pos);
    }
    //kollar om Objektet är fixerat
    if (this.currentFixed !== true) {
      // hittar hastigheten ( delta Pos / delta t)
      this.velocity.equal({
        x: (this.pos.x - this.oldpos.x) / scale,
        y: (this.pos.y - this.oldpos.y) / scale,
      });
      this.velocity.mult(friction);
      //updaterar gamla positionen
      this.oldpos.equal(this.pos);

      //Flyttar objektet med dess hastighet
      this.pos.add({
        x: this.velocity.x * scale + this.acceleration.x * scale,
        y: this.velocity.y * scale + this.acceleration.y * scale,
      });
      // Sätter acceleration till 0
      this.acceleration.reset();
    } else {
      this.acceleration.reset();

      this.pos.equal(this.fixedpos);
      this.oldpos.equal(this.pos);
    }
  }
  draw() {
    this.color = "black";
    if (this.currentlyHovered == true) {
      ctx.strokeStyle = `#0075ff`;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 4, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.fillStyle = `${this.color}`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  accelerate(accX, accY) {
    this.acceleration.x += accX * deltaT * deltaT;
    this.acceleration.y += accY * deltaT * deltaT;
  }
}

// en stick är en link mellan två partiklar
let sticks = [];
class stick {
  constructor(p1, p2) {
    this.startPoint = p1;
    this.endPoint = p2;
    this.startpos = new Vector(p1.pos.x, p1.pos.y);
    this.endpos = new Vector(p2.pos.x, p2.pos.y);
    this.length = dist(p1.pos, p2.pos);
    sticks.push(this);
    this.color;
  }
  update() {
    this.startpos.equal(this.startPoint.pos);
    this.endpos.equal(this.endPoint.pos);

    let dir = Dir(this.startpos, this.endpos);
    let Dist = dist(this.startpos, this.endpos);
    let dDist = Dist - this.length;
    this.color = `rgb(0, 0, 0)`;
    if (dDist > 3 || dDist < -3) {
      this.color = `rgb($0, 0, $0)`;
    }

    if (dDist > 50) {
      sticks.splice(sticks.indexOf(this), 1);
      this.startPoint.solid = true;
      this.endPoint.solid = true;
    }
    if (dDist < -20) {
      sticks.splice(sticks.indexOf(this), 1);
      this.startPoint.solid = true;
      this.endPoint.solid = true;
    }

    this.startPoint.pos.x += Math.cos(dir) * (dDist / 2);
    this.startPoint.pos.y += Math.sin(dir) * (dDist / 2);
    this.endPoint.pos.x -= Math.cos(dir) * (dDist / 2);
    this.endPoint.pos.y -= Math.sin(dir) * (dDist / 2);
  }
  draw() {
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.startpos.x, this.startpos.y);
    ctx.lineTo(this.endpos.x, this.endpos.y);
    ctx.stroke();
  }
}

// Gör ett rep
function rope(start, end, length, startState) {
  new particle(start.x, start.y, 0.5, startState, true);

  for (let i = 1; i < length; i++) {
    new particle(start.x + i * 20, start.y, 0.5, false, true);
  }

  for (let i = 0; i < length - 1; i++) {
    new stick(
      particles[particles.length - length + i],
      particles[particles.length - length + i + 1]
    );
  }

  if (end !== false) {
    particles[particles.length - 1].fixed = true;
    particles[particles.length - 1].startpos.x = end.x;
    particles[particles.length - 1].startpos.y = end.y;
  }
}
// gör ett tyg
function cloth(start, lengthX, lengthY) {
  for (let i = 0; i < lengthX; i++) {
    new particle(start.x + i * 10, start.y, 0.25, true, false);
  }
  for (let i = 1; i < lengthY; i++) {
    for (let j = 0; j < lengthX; j++) {
      new particle(start.x + j * 10, start.y + i * 10, 0.25, false, false);
    }
  }

  for (let j = 0; j < lengthY; j++) {
    for (let i = 0; i < lengthX - 1; i++) {
      new stick(
        particles[particles.length - lengthX * lengthY + i + j * lengthX],
        particles[particles.length - lengthX * lengthY + i + 1 + j * lengthX]
      );
      new stick(
        particles[particles.length - lengthX * lengthY + i + j * lengthX],
        particles[
          particles.length - lengthX * lengthY + i + lengthX + j * lengthX
        ]
      );
    }
  }
}

// Målar hela canvasen vit
function clear() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
let rectangles = [];
class rectangle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    rectangles.push(this);
  }
  contains(child) {
    return (
      child.pos.x >= this.x - this.width &&
      child.pos.x <= this.x + this.width &&
      child.pos.y >= this.y - this.height &&
      child.pos.y <= this.y + this.height
    );
  }
  intersects(range) {
    return !(
      range.x - range.width > this.x + this.width ||
      range.x + range.width < this.x - this.width ||
      range.y - range.height > this.y + this.height ||
      range.y + range.height < this.y - this.height
    );
  }
  draw() {
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.rect(
      this.x - this.width,
      this.y - this.height,
      this.width * 2,
      this.height * 2
    );
    ctx.stroke();
  }
}

class quadTree {
  constructor(boundary, n) {
    this.boundary = boundary;
    this.capacity = n;
    this.children = [];
    this.divided = false;
  }

  subdivide() {
    let nw = new rectangle(
      this.boundary.x - this.boundary.width / 2,
      this.boundary.y - this.boundary.height / 2,
      this.boundary.width / 2,
      this.boundary.height / 2
    );
    this.northwest = new quadTree(nw, this.capacity);
    let ne = new rectangle(
      this.boundary.x + this.boundary.width / 2,
      this.boundary.y - this.boundary.height / 2,
      this.boundary.width / 2,
      this.boundary.height / 2
    );
    this.northeast = new quadTree(ne, this.capacity);
    let sw = new rectangle(
      this.boundary.x - this.boundary.width / 2,
      this.boundary.y + this.boundary.height / 2,
      this.boundary.width / 2,
      this.boundary.height / 2
    );
    this.southwest = new quadTree(sw, this.capacity);
    let se = new rectangle(
      this.boundary.x + this.boundary.width / 2,
      this.boundary.y + this.boundary.height / 2,
      this.boundary.width / 2,
      this.boundary.height / 2
    );
    this.southeast = new quadTree(se, this.capacity);
    this.divided = true;
  }
  query(range, found) {
    if (!found) {
      found = [];
    }
    if (!this.boundary.intersects(range)) {
      // return nothing
      return;
    } else {
      this.children.forEach((child) => {
        if (range.contains(child)) {
          found.push(child);
        }
      });
      if (this.divided) {
        this.northwest.query(range, found);
        this.northeast.query(range, found);
        this.southwest.query(range, found);
        this.southeast.query(range, found);
      }
    }
    return found;
  }

  draw() {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.rect(
      this.boundary.x - this.boundary.width,
      this.boundary.y - this.boundary.height,
      this.boundary.width * 2,
      this.boundary.height * 2
    );
    ctx.stroke();
    if (this.divided) {
      this.northeast.draw();
      this.northwest.draw();
      this.southeast.draw();
      this.southwest.draw();
    }
  }

  insert(child) {
    if (!this.boundary.contains(child)) {
      return;
    }

    if (this.children.length < this.capacity) {
      this.children.push(child);
    } else {
      if (!this.divided) {
        this.subdivide();
      }
      this.northeast.insert(child);
      this.northwest.insert(child);
      this.southeast.insert(child);
      this.southwest.insert(child);
    }
  }
  draw() {
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.rect(
      this.boundary.x - this.boundary.width,
      this.boundary.y - this.boundary.height,
      this.boundary.width * 2,
      this.boundary.height * 2
    );
    ctx.stroke();
    if (this.divided) {
      this.northeast.draw();
      this.northwest.draw();
      this.southwest.draw();
      this.southeast.draw();
    }
  }
}

boundary = new rectangle(
  canvas.width / 2,
  canvas.height / 2,
  canvas.width / 2,
  canvas.height / 2
);
qTree = new quadTree(boundary, 4);

function collisionTree() {
  rectangles = [];
  qTree.children = [];
  qTree.divided = false;
  particles.forEach((Object) => {
    qTree.insert(Object);
  });

  particles.forEach((particle) => {
    if (particle.solid) {
      range = new rectangle(
        particle.pos.x,
        particle.pos.y,
        particle.radius * 2,
        particle.radius * 2
      );
      let others = qTree.query(range);
      others.forEach((other) => {
        if (other !== particle) {
          if (dist(particle.pos, other.pos) <= particle.radius + other.radius) {
            if (particle.solid && other.solid) {
              resolveCollision(particle, other);
            }
          }
        }
      });
    }
  });
}

function bomb(x, y, power) {
  console.log("boom");
  let bombPos = {
    x: x,
    y: y,
  };
  console.log(bombPos);
  particles.forEach((Object) => {
    // console.log(dist(Object.pos, bombPos));
    if (dist(Object.pos, bombPos) < power * 20) {
      console.log(Object);
      blastDirection = Dir(Object.pos, bombPos);
      Object.accelerate(
        Math.cos(blastDirection) * -power * 100,
        Math.sin(blastDirection) * -power * 100
      );
    }
  });
}

function gravity() {
  particles.forEach((Object) => {
    Object.accelerate(0, 10);
  });
}

// Uppdaterar alla Objekt
function verletIntegrate() {
  particles.forEach((Object) => {
    Object.update();
  });
  sticks.forEach((Object) => {
    Object.update();
  });
}

// Målar ut alla Objekt
function drawObjects() {
  particles.forEach((Object) => {
    Object.draw();
  });
  mouseCursor.draw();
  sticks.forEach((Object) => {
    Object.draw();
  });
  if (showQuadTree) {
    rectangles.forEach((Object) => {
      Object.draw();
    });
    qTree.draw();
  }
}

function applyConstraints() {
  if (showCircle == true) {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 300, 0, 2 * Math.PI);
    ctx.stroke();
  }
  particles.forEach((Object) => {
    if (showCircle == true) {
      if (
        dist(Object.pos, { x: canvas.width / 2, y: canvas.height / 2 }) >
        300 - Object.radius
      ) {
        let angle = Dir(Object.pos, {
          x: canvas.width / 2,
          y: canvas.height / 2,
        });

        Object.pos.x +=
          Math.cos(angle) *
          (dist(Object.pos, { x: canvas.width / 2, y: canvas.height / 2 }) -
            300 +
            Object.radius);

        Object.pos.y +=
          Math.sin(angle) *
          (dist(Object.pos, { x: canvas.width / 2, y: canvas.height / 2 }) -
            300 +
            Object.radius);
      }
    }
    if (Object.pos.x > canvas.width - Object.radius) {
      Object.pos.x = canvas.width - Object.radius;
      Object.oldpos.x = Object.pos.x + Object.velocity.x * deltaT * scale * CoR;
    } else if (Object.pos.x < 0 + Object.radius) {
      Object.pos.x = Object.radius;
      Object.oldpos.x = Object.pos.x + Object.velocity.x * deltaT * scale * CoR;
    }

    if (Object.pos.y > canvas.height - Object.radius) {
      Object.pos.y = canvas.height - Object.radius;
      Object.oldpos.y = Object.pos.y + Object.velocity.y * deltaT * scale * CoR;
    } else if (Object.pos.y < 0 + Object.radius) {
      Object.pos.y = Object.radius;
      Object.oldpos.y = Object.pos.y + Object.velocity.y * deltaT * scale * CoR;
    }
  });
}

function resolveCollision(Object, Other) {
  let collisionDistance =
    Math.abs(dist(Object.pos, Other.pos) - (Object.radius + Other.radius)) / 2;

  const collisionAngle = Dir(Object.pos, Other.pos);

  Object.pos.x += Math.cos(collisionAngle - Math.PI) * collisionDistance;
  Object.pos.y += Math.sin(collisionAngle - Math.PI) * collisionDistance;

  Other.pos.x += Math.cos(collisionAngle) * collisionDistance;
  Other.pos.y += Math.sin(collisionAngle) * collisionDistance;
}

canvas.addEventListener("mousemove", function (e) {
  mousePos.x = e.offsetX;
  mousePos.y = e.offsetY;
  if (currentStyle == "move") {
    if (mouseDown == true) {
      pickedUp.forEach((Object) => {
        Object.fixedpos.x = mousePos.x - deltaXList[pickedUp.indexOf(Object)];
        Object.fixedpos.y = mousePos.y - deltaYList[pickedUp.indexOf(Object)];
      });
    }
  }
});

canvas.addEventListener("mouseup", function (e) {
  mouseDown = false;
  pickedUp.forEach((Object) => {
    Object.currentFixed = Object.fixed;
  });
  pickedUp = [];
  deltaXList = [];
  deltaYList = [];
});

let mouseDown = false;

let deltaXList = [];
let deltaYList = [];
let number = 25;
pickedUp = [];
canvas.addEventListener("mousedown", function (e) {
  mouseDown = true;
  if (currentStyle == "particle") {
    for (let i = 0; i < particleAmount.value; i++) {
      new particle(
        mousePos.x +
          (Math.ceil(Math.sqrt(i)) * particleSlider.value * scale) / 30,
        mousePos.y +
          (Math.ceil(Math.sqrt(i)) * particleSlider.value * scale) / 30,
        particleSlider.value,
        false,
        true
      );
    }
  } else if (currentStyle == "rope") {
    rope({ x: mousePos.x, y: mousePos.y }, false, ropeSlider.value, true);
  } else if (currentStyle == "bomb") {
    bomb(mousePos.x, mousePos.y, bombSlider.value);
  } else if (currentStyle == "cloth") {
    cloth(mousePos, number, number);
  } else if (currentStyle == "move") {
    particles.forEach((Object) => {
      if (dist(Object.pos, mousePos) < mouseCursor.radius) {
        pickedUp.push(Object);
        deltaXList.push(mousePos.x - Object.pos.x);
        deltaYList.push(mousePos.y - Object.pos.y);
        Object.fixedpos.x = mousePos.x - deltaXList[pickedUp.indexOf(Object)];
        Object.fixedpos.y = mousePos.y - deltaYList[pickedUp.indexOf(Object)];
      }
    });
    pickedUp.forEach((Object) => {
      Object.currentFixed = true;
    });
  } else if (currentStyle == "select") {
    particles.forEach((Object) => {
      if (dist(mousePos, Object.pos) < Object.radius) {
        selectedObject = Object;
        selectedObject.currentlyHovered = true;
        document.getElementById("solidCheckbox").checked = selectedObject.solid;
        document.getElementById("fixedCheckbox").checked = selectedObject.fixed;
      } else {
        Object.currentlyHovered = false;
      }
    });
  }
  console.log(pickedUp);
});

let substep = 4;
var lastLoop;

window.setInterval(() => {
  clear();
  gravity();
  verletIntegrate();
  applyConstraints();
  drawObjects();
  collisionTree();

  if (selectedObject !== false) {
    document.getElementById("particleUI").style.display = "flex";
    updateParticleUI(selectedObject);
  }

  if (currentStyle == "select") {
    particles.forEach((particle) => {
      if (dist(mousePos, particle.pos) < particle.radius) {
        particle.currentlyHovered = true;
      } else {
        if (selectedObject !== particle) {
          particle.currentlyHovered = false;
        }
      }
    });
  }

  var thisLoop = new Date();
  fps = 1000 / (thisLoop - lastLoop);
  lastLoop = thisLoop;
  fpsInfo.innerHTML = `Fps: ${Math.round(fps)}`;
}, 1000 / (60 * substep));

// Hittar distans mellan två objekt
function dist(a, b) {
  x1 = a.x;
  y1 = a.y;
  x2 = b.x;
  y2 = b.y;
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
// Hittar riktning mellan två objekt
function Dir(origin, other) {
  x = other.x;
  y = other.y;
  if (other.y >= origin.y) {
    return Math.acos((x - origin.x) / dist(origin, other));
  } else if (other.y <= origin.y) {
    return 2 * Math.PI - Math.acos((x - origin.x) / dist(origin, other));
  }
}

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

function radians_to_degrees(rad) {
  var pi = Math.PI;
  return rad * (180 / pi);
}

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
