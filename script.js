let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let fps;
let fpsInfo = document.getElementById("fps");
let deltaT;

let scale = 100;
let loss = 0.7;
let mousePos = {
  x: 0,
  y: 0,
};

let showCircle = true;

let friction = 0.995;

let particles = [];

class particle {
  constructor(x, y, mass) {
    particles.push(this);
    this.pos = {
      x: x,
      y: y,
    };
    this.mass = mass;
    this.velocity = {
      x: 0,
      y: 0,
    };

    this.oldpos = {
      x: x,
      y: y,
    };

    this.acceleration = {
      x: 0,
      y: 0,
    };

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
    Object.velocity.x =
      ((Object.pos.x - Object.oldpos.x) / scale / deltaT) * friction;
    Object.velocity.y =
      ((Object.pos.y - Object.oldpos.y) / scale / deltaT) * friction;

    Object.oldpos.x = Object.pos.x;
    Object.oldpos.y = Object.pos.y;

    Object.pos.x +=
      Object.velocity.x * scale * deltaT + Object.acceleration.x * scale;
    Object.pos.y +=
      Object.velocity.y * scale * deltaT + Object.acceleration.y * scale;

    Object.acceleration.x = 0;
    Object.acceleration.y = 0;
  });
}

function solveCollision(Object, Other) {
  let distance =
    (Object.pos.x - Other.pos.x) ** 2 + (Object.pos.y - Other.pos.y) ** 2;

  return distance <= (Object.radius + Other.radius) ** 2;
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

  if (Object.velocity.x < 0) {
    if (Object.velocity.y >= 0) {
      vInit1 *= -1;
    }
  }
  if (Object.velocity.y < 0) {
    if (Object.velocity.x >= 0) {
      vInit1 *= -1;
    }
  }

  if (Other.velocity.x < 0) {
    if (Other.velocity.y >= 0) {
      vInit2 *= -1;
    }
  }
  if (Other.velocity.y < 0) {
    if (Other.velocity.x >= 0) {
      vInit2 *= -1;
    }
  }

  let vFin1 =
    ((m1 - m2) / (m1 + m2)) * vInit1 + ((2 * m2) / (m1 + m2)) * vInit2;

  let vFin2 =
    ((2 * m1) / (m1 + m2)) * vInit1 + ((m2 - m1) / (m1 + m2)) * vInit2;

  Object.velocity.x = Math.cos(collisionAngle - Math.PI) * vFin1 * loss;
  Object.velocity.y = Math.sin(collisionAngle - Math.PI) * vFin1 * loss;

  Other.velocity.x = Math.cos(collisionAngle) * vFin2 * loss;
  Other.velocity.y = Math.sin(collisionAngle) * vFin2 * loss;
}

function bomb(x, y, power) {
  console.log("boom");
  let bombPos = {
    x: x,
    y: y,
  };

  for (let i = 0; i < particles.length; i++) {
    const Object = particles[i];
    if (dist(Object, bombPos) < 100) {
      blastDirection = Dir(Object.pos, bombPos);
      Object.velocity.x += Math.cos(blastDirection) * 50;
      Object.velocity.y += Math.sin(blastDirection) * 50;
    }
  }
}

function applyConstraints() {
  if (showCircle == true) {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 400, 0, 2 * Math.PI);
    ctx.stroke();
  }

  particles.forEach((Object) => {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i] !== Object) {
        if (solveCollision(Object, particles[i])) {
          resolveCollision(Object, particles[i]);
        } else {
        }
      }
    }
    if (showCircle == true) {
      if (
        dist(Object.pos, { x: canvas.width / 2, y: canvas.height / 2 }) >
        400 - Object.radius
      ) {
        let angle = Dir(Object.pos, {
          x: canvas.width / 2,
          y: canvas.height / 2,
        });

        Object.pos.x +=
          Math.cos(angle) *
          (dist(Object.pos, { x: canvas.width / 2, y: canvas.height / 2 }) -
            400 +
            Object.radius);

        Object.pos.y +=
          Math.sin(angle) *
          (dist(Object.pos, { x: canvas.width / 2, y: canvas.height / 2 }) -
            400 +
            Object.radius);
      }
    }
    if (Object.pos.x > canvas.width - Object.radius) {
      Object.pos.x = canvas.width - Object.radius;
      Object.oldpos.x = Object.pos.x + Object.velocity.x * deltaT * scale;
    } else if (Object.pos.x < 0 + Object.radius) {
      Object.pos.x = Object.radius;
      Object.oldpos.x = Object.pos.x + Object.velocity.x * deltaT * scale;
    }

    if (Object.pos.y > canvas.height - Object.radius) {
      var timerStop = new Date();
      // console.log(timerStop - timerStart);
      Object.pos.y = canvas.height - Object.radius;
      Object.oldpos.y = Object.pos.y + Object.velocity.y * deltaT * scale;
    } else if (Object.pos.y < 0 + Object.radius) {
      Object.pos.y = Object.radius;
      Object.oldpos.y = Object.pos.y + Object.velocity.y * deltaT * scale;
    }
  });
}

canvas.addEventListener("mousemove", function (e) {
  mousePos.x = e.offsetX / 0.75;
  mousePos.y = e.offsetY / 0.75;
});

canvas.addEventListener("mouseup", function (e) {
  bomb(mousePos.x, mousePos.y, 50);
});

function drawObjects() {
  particles.forEach((Object) => {
    Object.draw();

    Object.accelerate(
      Math.cos(degrees_to_radians(-canvasRotation) + Math.PI / 2) * 10,
      Math.sin(degrees_to_radians(-canvasRotation) + Math.PI / 2) * 10
    );
  });
}

let canvasRotation = 0;

window.addEventListener("keydown", function (e) {
  if (e.key == "l") {
    new particle(mousePos.x, mousePos.y, Math.random() * 10 + 4);
    particles[particles.length - 1].accelerate(1000, 700);
  }

  if (e.key == "h") {
    new particle(mousePos.x, mousePos.y, 500);
    particles[particles.length - 1].accelerate(1000, 700);
  }

  if (e.key == "k") {
    showCircle = false;
  }

  if (e.keyCode == "37") {
    canvasRotation += 15;
  }

  if (e.keyCode == "39") {
    canvasRotation -= 15;
  }

  canvas.style.transform = `rotate(${canvasRotation}deg)`;
});

var lastLoop;

function update() {
  requestAnimationFrame(update);

  var thisLoop = new Date();
  fps = 1000 / (thisLoop - lastLoop);
  lastLoop = thisLoop;
  fpsInfo.innerHTML = `Fps: ${Math.round(fps)}`;
  deltaT = 1 / fps;

  clear();
  verletIntegrate();

  applyConstraints();
  drawObjects();
}

update();

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
