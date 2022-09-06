let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let fps;
let fpsInfo = document.getElementById("ui-fps");
let deltaT;

let particleSlider = document.getElementById("particle-Slider").value;

let ropeSlider = document.getElementById("rope-Slider").value;

let bombSlider = document.getElementById("bomb-Slider").value;

let clothSlider = document.getElementById("cloth-Slider").value;

let scale = 100;
// coefficient of restitution
let CoR = 0.7;
let mousePos = {
  x: 0,
  y: 0,
};

let showCircle = true;

let friction = 0.995;

let particles = [];
let buttons = [];

let sticks = [];
let currentStyle = "particle";

class Vector {
  constructor(x, y) {
    (this.x = x), (this.y = y);
  }
}

class stick {
  constructor(p1, p2) {
    this.startPoint = p1;
    this.endPoint = p2;
    this.startpos = new Vector(p1.pos.x, p1.pos.y);
    this.endpos = new Vector(p2.pos.x, p2.pos.y);
    this.length = dist(p1.pos, p2.pos);
    sticks.push(this);
  }
  update() {
    this.startpos.x = this.startPoint.pos.x;
    this.startpos.y = this.startPoint.pos.y;

    this.endpos.x = this.endPoint.pos.x;
    this.endpos.y = this.endPoint.pos.y;

    let dir = Dir(this.startpos, this.endpos);
    let Dist = dist(this.startpos, this.endpos);
    let dDist = Dist - this.length;
    if (dDist > 20) {
      sticks.splice(sticks.indexOf(this), 1);
      this.startPoint.solid = true;
      this.endPoint.solid = true;
    }
    if (dDist < -5) {
      sticks.splice(sticks.indexOf(this), 1);
      this.startPoint.solid = true;
      this.endPoint.solid = true;
    }
    if (dDist != 0) {
      this.startPoint.pos.x += Math.cos(dir) * (dDist / 2);
      this.startPoint.pos.y += Math.sin(dir) * (dDist / 2);
      this.endPoint.pos.x -= Math.cos(dir) * (dDist / 2);
      this.endPoint.pos.y -= Math.sin(dir) * (dDist / 2);
    }
  }
  draw() {
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(this.startpos.x, this.startpos.y);
    ctx.lineTo(this.endpos.x, this.endpos.y);
    ctx.stroke();
  }
}

class particle {
  constructor(x, y, mass, state, solid) {
    particles.push(this);
    this.pos = new Vector(x, y);
    this.mass = mass;
    this.velocity = new Vector(0, 0);
    if (!state) {
      this.state = false;
    } else {
      this.state = state;
    }
    this.oldpos = new Vector(x, y);
    this.startpos = new Vector(x, y);
    this.acceleration = new Vector(0, 0);
    if (!solid) {
      this.solid = false;
    } else {
      this.solid = true;
    }
    this.color = getRandomColor();
    this.radius = (mass / 30) * scale;
  }
  draw() {
    ctx.strokeStyle = "white";
    ctx.lineWidth = "2";
    ctx.fillStyle = `${this.color}`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  accelerate(accX, accY) {
    this.acceleration.x += accX * deltaT * deltaT;
    this.acceleration.y += accY * deltaT * deltaT;
  }
}

function clear() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function verletIntegrate() {
  particles.forEach((Object) => {
    if (Object.state == false) {
      Object.velocity.x =
        ((Object.pos.x - Object.oldpos.x) / scale / deltaT) * friction;
      Object.velocity.y =
        ((Object.pos.y - Object.oldpos.y) / scale / deltaT) * friction;
      minimunVelocity = 0;

      if (
        Object.velocity.x < minimunVelocity &&
        Object.velocity.x > -minimunVelocity
      ) {
        Object.velocity.x = 0;
      }

      if (
        Object.velocity.y < minimunVelocity &&
        Object.velocity.y > -minimunVelocity
      ) {
        Object.velocity.x = 0;
      }

      Object.oldpos.x = Object.pos.x;
      Object.oldpos.y = Object.pos.y;

      Object.pos.x +=
        Object.velocity.x * scale * deltaT + Object.acceleration.x * scale;
      Object.pos.y +=
        Object.velocity.y * scale * deltaT + Object.acceleration.y * scale;

      Object.acceleration.x = 0;
      Object.acceleration.y = 0;
    } else {
      Object.pos.x = Object.startpos.x;
      Object.pos.y = Object.startpos.y;
    }
  });
}

function solveCollision(Object, Other) {
  let distance =
    (Object.pos.x - Other.pos.x) ** 2 + (Object.pos.y - Other.pos.y) ** 2;

  return distance <= (Object.radius + Other.radius) ** 2;
}

function rope(start, end, length, startState) {
  new particle(start.x, start.y, 1.5, startState, true);

  for (let i = 1; i < length; i++) {
    new particle(start.x + i * 20, start.y, 1.5, false, true);
  }

  for (let i = 0; i < length - 1; i++) {
    new stick(
      particles[particles.length - length + i],
      particles[particles.length - length + i + 1]
    );
  }

  if (end !== false) {
    particles[particles.length - 1].state = true;
    particles[particles.length - 1].startpos.x = end.x;
    particles[particles.length - 1].startpos.y = end.y;
  }
}

function cloth(start, lengthX, lengthY) {
  for (let i = 0; i < lengthX; i++) {
    new particle(start.x + i * 15, start.y, 1, true, true);
  }
  for (let i = 1; i < lengthY; i++) {
    for (let j = 0; j < lengthX; j++) {
      new particle(start.x + j * 15, start.y + i * 15, 1, false, false);
    }
  }

  for (let i = 0; i < lengthX * lengthY; i++) {}

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

function resolveCollision(Object, Other) {
  let collisionDistance =
    Math.abs(dist(Object.pos, Other.pos) - (Object.radius + Other.radius)) / 2;

  const collisionAngle = Dir(Object.pos, Other.pos);

  Object.pos.x += Math.cos(collisionAngle - Math.PI) * collisionDistance;
  Object.pos.y += Math.sin(collisionAngle - Math.PI) * collisionDistance;

  Other.pos.x += Math.cos(collisionAngle) * collisionDistance;
  Other.pos.y += Math.sin(collisionAngle) * collisionDistance;

  const m1 = Object.mass;
  const m2 = Other.mass;

  let vInit1 = Math.sqrt(Object.velocity.x ** 2 + Object.velocity.y ** 2);
  let vInit2 = Math.sqrt(Other.velocity.x ** 2 + Other.velocity.y ** 2);

  // if (Object.velocity.x < 0) {
  //   if (Object.velocity.y >= 0) {
  //     vInit1 *= -1;
  //   }
  // }
  // if (Object.velocity.y < 0) {
  //   if (Object.velocity.x >= 0) {
  //     vInit1 *= -1;
  //   }
  // }

  // if (Other.velocity.x < 0) {
  //   if (Other.velocity.y >= 0) {
  //     vInit2 *= -1;
  //   }
  // }
  // if (Other.velocity.y < 0) {
  //   if (Other.velocity.x >= 0) {
  //     vInit2 *= -1;
  //   }
  // }

  // let vFin1 =
  //   ((m1 - m2) / (m1 + m2)) * vInit1 + ((2 * m2) / (m1 + m2)) * vInit2;

  // let vFin2 =
  //   ((2 * m1) / (m1 + m2)) * vInit1 + ((m2 - m1) / (m1 + m2)) * vInit2;

  let vFin1 =
    (CoR * m2 * (vInit2 - vInit1) + m1 * vInit1 + m2 * vInit2) / (m1 + m2);
  let vFin2 =
    (CoR * m1 * (vInit1 - vInit2) + m1 * vInit1 + m2 * vInit2) / (m1 + m2);

  Object.velocity.x = Math.cos(collisionAngle - Math.PI) * vFin1;
  Object.velocity.y = Math.sin(collisionAngle - Math.PI) * vFin1;

  Other.velocity.x = Math.cos(collisionAngle) * vFin2;
  Other.velocity.y = Math.sin(collisionAngle) * vFin2;
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

function applyConstraints() {
  if (showCircle == true) {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 300, 0, 2 * Math.PI);
    ctx.stroke();
  }
  sticks.forEach((Object) => {
    Object.update();
    Object.draw();
  });
  particles.forEach((Object) => {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i] !== Object) {
        if (solveCollision(Object, particles[i])) {
          // console.log(Object.solid);
          console.log(particles[i].solid);
          if (Object.solid == true || particles[i].solid == true) {
            resolveCollision(Object, particles[i]);
          }
        } else {
        }
      }
    }
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
let mousedown = false;
canvas.addEventListener("mousemove", function (e) {
  mousePos.x = e.offsetX;
  mousePos.y = e.offsetY;
});
let number = 15;
canvas.addEventListener("mousedown", function (e) {
  mousedown = true;
  console.log(clothSlider);
  if (currentStyle == "particle") {
    new particle(mousePos.x, mousePos.y, particleSlider, false, true);
  } else if (currentStyle == "rope") {
    rope({ x: mousePos.x, y: mousePos.y }, false, ropeSlider, true);
  } else if (currentStyle == "bomb") {
    bomb(mousePos.x, mousePos.y, bombSlider);
  } else if (currentStyle == "cloth") {
    cloth(mousePos, number, number);
  }
});

canvas.addEventListener("mouseup", function (e) {
  mousedown = false;
});

function drawObjects() {
  particles.forEach((Object) => {
    Object.draw();
    // gravity

    Object.accelerate(
      Math.cos(degrees_to_radians(-canvasRotation) + Math.PI / 2) * 10,
      Math.sin(degrees_to_radians(-canvasRotation) + Math.PI / 2) * 10
    );
  });
  buttons.forEach((Object) => {
    Object.draw();
  });
}

let canvasRotation = 0;

window.addEventListener("keydown", function (e) {
  if (e.keyCode == "37") {
    canvasRotation += 15;
  }

  if (e.keyCode == "39") {
    canvasRotation -= 15;
  }

  canvas.style.transform = `rotate(${canvasRotation}deg)`;
});

var lastLoop;

// function update() {
//   requestAnimationFrame(update);

//   var thisLoop = new Date();
//   fps = 1000 / (thisLoop - lastLoop);
//   lastLoop = thisLoop;
//   fpsInfo.innerHTML = `Fps: ${Math.round(fps)}`;
//   deltaT = 1 / fps;

//   clear();
//   verletIntegrate();

//   applyConstraints();
//   drawObjects();
// }

// update();
let substep = 16;

window.setInterval(() => {
  // requestAnimationFrame(update);

  particleSlider = document.getElementById("particle-Slider").value;

  ropeSlider = document.getElementById("rope-Slider").value;

  bombSlider = document.getElementById("bomb-Slider").value;

  clothSlider = document.getElementById("cloth-Slider").value;

  var thisLoop = new Date();
  fps = 1000 / (thisLoop - lastLoop);
  lastLoop = thisLoop;
  fpsInfo.innerHTML = `Fps: ${Math.round(fps)}`;

  document.getElementById(
    "ui-amount"
  ).innerHTML = `Objects : ${particles.length}`;
  deltaT = 1 / fps;

  clear();
  verletIntegrate();

  applyConstraints();
  drawObjects();
}, 1000 / (60 * substep));

//
//
// Olika funktioner
//
//

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

function isInside(pos, rect) {
  return (
    pos.x > rect.pos.x &&
    pos.x < rect.pos.x + rect.width &&
    pos.y < rect.y + rect.height &&
    pos.y > rect.y
  );
}
