let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let fps;
let fpsInfo = document.getElementById("fps");
let deltaT;

let scale = 100;

let mousePos = {
  x: 0,
  y: 0,
};

let friction = 0.995;

let particles = [];

class particle {
  constructor(x, y, mass) {
    this.P = {
      x: 0,
      y: 0,
    };
    particles.push(this);
    this.pos = {
      x: x,
      y: y,
    };
    this.color = getRandomColor();
    this.oldpos = {
      x: x,
      y: y,
    };
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.acceleration = {
      x: 0,
      y: 0,
    };
    this.mass = mass;
    this.radius = 0.7 * scale;
  }
  draw() {
    this.P.x = this.mass * this.velocity.x;
    this.P.y = this.mass * this.velocity.y;

    this.angle = Dir(this.pos, {
      x: this.pos.x + this.velocity.x,
      y: this.pos.y + this.velocity.y,
    });

    ctx.fillStyle = `${this.color}`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "blue";
    ctx.lineWidth = "5";
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(
      this.pos.x +
        Math.cos(this.angle) *
          (Math.abs(this.velocity.y) + Math.abs(this.velocity.x)) *
          5,
      this.pos.y +
        Math.sin(this.angle) *
          (Math.abs(this.velocity.y) + Math.abs(this.velocity.x)) *
          5
    );
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

function solveCollisions(Object) {
  for (let index = 0; index < particles.length; index++) {
    var Other = particles[index];
    if (Other !== Object) {
      if (
        isTouching(
          {
            x: Object.pos.x,
            y: Object.pos.y,
          },
          Other.pos,
          Other.radius,
          Object.radius
        )
      ) {
        return [true, Other];
      }
    }
  }
  return [false, NaN];
}

function verletCompute() {
  particles.forEach((Object) => {
    Object.velocity.x =
      ((Object.pos.x - Object.oldpos.x) / scale / deltaT) * friction;
    Object.velocity.y =
      ((Object.pos.y - Object.oldpos.y) / scale / deltaT) * friction;
    // console.log(Object.velocity);
    Object.oldpos.x = Object.pos.x;
    Object.oldpos.y = Object.pos.y;
    if (solveCollisions(Object)[0] == false) {
      Object.pos.x +=
        Object.velocity.x * scale * deltaT + Object.acceleration.x * scale;
      Object.pos.y +=
        Object.velocity.y * scale * deltaT + Object.acceleration.y * scale;
    } else {
      // let Other = solveCollisions(Object)[1];
      // let collisionAngle = Dir(Object.pos, Other.pos);
      // console.log(Other.pos);
      // Object.pos.x -= Math.cos(collisionAngle) * 55;

      // Object.pos.y -= Math.sin(collisionAngle) * 55;
      // Other.pos.x -= Math.cos(collisionAngle + Math.PI) * 55;

      // Other.pos.y -= Math.sin(collisionAngle + Math.PI) * 55;
      console.log("yo");
      Object.pos.x +=
        Object.velocity.x * scale * deltaT + Object.acceleration.x * scale;
      Object.pos.y +=
        Object.velocity.y * scale * deltaT + Object.acceleration.y * scale;
    }

    Object.acceleration.x = 0;
    Object.acceleration.y = 0;

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
  });
}

p1 = new particle(200, 380, 20);
// p1.acceleration.x += 10 / scale;
window.addEventListener("mouseup", function (e) {
  new particle(mousePos.x, mousePos.y, 20);
  // particles[particles.length - 1].acceleration.x += 10 / scale;
});

canvas.addEventListener("mousemove", function (e) {
  mousePos.x = e.offsetX;
  mousePos.y = e.offsetY;
  console.log(mousePos);
});

var lastLoop = new Date();
var timerStart = new Date();

function update() {
  requestAnimationFrame(update);
  clear();
  console.log(p1.P);
  // Fps counter
  var thisLoop = new Date();
  fps = 1000 / (thisLoop - lastLoop);
  lastLoop = thisLoop;
  fpsInfo.innerHTML = `Fps: ${Math.round(fps)}`;
  deltaT = 1 / fps;

  verletCompute();

  particles.forEach((Object) => {
    // console.log(solveCollisions(Object));
    Object.accelerate(0, 9.82);
  });

  // console.log(p1.velocity.x / deltaT, p1.velocity.y / deltaT);
  // Draws all particles

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 400, 0, 2 * Math.PI);
  ctx.fill();

  particles.forEach((Object) => {
    Object.draw();
  });
}

update();

function isTouching(a, b, c, d) {
  if (dist(a, b) < c + d) {
    return true;
  } else {
    return false;
  }
}

function dist(a, b) {
  x1 = a.x;
  y1 = a.y;
  x2 = b.x;
  y2 = b.y;
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function Dir(origin, other) {
  x = other.x;
  y = other.y;
  if (other.y >= origin.y) {
    return Math.acos((x - origin.x) / dist(origin, other));
  } else if (other.y <= origin.y) {
    return 2 * Math.PI - Math.acos((x - origin.x) / dist(origin, other));
  }
}
