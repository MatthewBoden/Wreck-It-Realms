// Matthew Bodenstein
// Custom Brick Breaker

let paddle;
let ball;
let bricks = [];
let customFont;
let score = 0;
let currentRound = 1;
const totalRounds = 5; // Total number of rounds
let brickColor;
let pointsPerBrick = 10; // Initial points per brick destroyed
let lives = 3;
let particles = []; // Array to store particles
let gameState = 'start'; // 'start' or 'play'
let instructionsText = 'Press Enter to Start';
let backgroundColorPicker, ballColorPicker, paddleColorPicker;
let backgroundButton, ballButton, paddleButton;
let bgCol = [50, 100, 200, 50];
let cameraShake = false;
let shakeIntensity = 5;
let shakeDuration = 20; // Number of frames for the shake effect
let shakeFrames = shakeDuration;
let cameraXOffset = 0;
let cameraYOffset = 0;
let bonusPoints = 100;
const trailLength = 30; // Number of segments in the trail
const trailOpacityDecay = 255 / trailLength; // Opacity decay for the trail segments
let ballTrail = [];
let chaos = false; // Flag to determine the spawning probability of special bricks
let chaosText = chaos ? '(C) Chaos Mode: Enabled' : '(C) Chaos Mode: Disabled';
let temp = 0;


// Colors for different rounds
const roundColors = [
  [24, 150, 50], // Dark green
  [0, 255, 0], // Light green
  [255, 255, 0], // Yellow
  [240, 100, 0], // Orange
  [255, 0, 0] // Red
];

// Handpose variables
// https://learn.ml5js.org/#/reference/handpose
let handpose;
let video;
let predictions = [];
function modelReady() {
  console.log('Model ready!');
}

function preload() {
  customFont = loadFont('Roboto-Bold.ttf');
}

function setup() {
  createCanvas(600, 400, WEBGL); // 3D Canvas
  setupGUI();
  monoSynth = new p5.MonoSynth();
  paddle = new Paddle(0, height / 2 - 20, 0);
  ball = new Ball();
  brickColor = roundColors[currentRound - 1]; // Initial brick color
  createBricks(); // Populate the global "bricks" array
  textFont(customFont); // Set the loaded font
  textSize(32); // Set the text size

  // Handpose setup
  video = createCapture(VIDEO);
  video.size(width, height);
  handpose = ml5.handpose(video, modelReady);

  handpose.on('predict', (results) => {
    predictions = results;
  });

  video.hide();

  // Add directional light and ambient light for better 3D lighting
  directionalLight(250, 250, 250, 0, 0, 1); // Directional light from above
  ambientLight(80, 80, 80);

  pointLight(0, 255, 200, -width / 2, -height / 2, 200);
  pointLight(100, 255, 100, width / 2, height / 2, 200);
}

function draw() {
  background(bgCol); // Changed background color to black
  if (gameState === 'start') {
    createBricks();
    // Display the start screen with instructions
    fill(255, 20, 20);    
    textSize(50);
    textAlign(CENTER, CENTER);
    text('"Wreck-It Realms"', 0, -150);
    textSize(32);
    text('Brick Breaker Game', 0, -50);
    text(instructionsText, 0, 50);
    textSize(20);
    text("By Matthew Bodenstein", 0, 150);

    textSize(18);
    text(chaosText, 0, 100);
  } else if (gameState === 'play') {
    lights(); // Ambient light
    ambientLight(200, 200, 200);
    strokeWeight(10);
    stroke(200);
    noFill();
    box(width, height, width);
    stroke(255);
    strokeWeight(1);
    brickColor = roundColors[currentRound - 1];

    // Update and render game elements
    paddle.update();
    paddle.display();
    ball.update();
    ball.display();

    for (let brick of bricks) {
      brick.display();
      
      
      if (ball.hits(brick)) {
        brick.destroy();
        
        ball.reverse('y'); // reverses y direction whne collides
        increaseScore(pointsPerBrick); // Increase the score when a brick is destroyed

        
        
        // Generate particles at the brick's position
        for (let i = 0; i < 10; i++) {
          particles.push(new Particle(brick.pos.x, brick.pos.y, brick.color));
        }
      }
    }

    if (ball.hits(paddle)) {
      const side = ball.hitsPaddleSide(paddle);
      if (side === 'left') {
        ball.velocity.x = -abs(ball.velocity.x); // Move left
      } else if (side === 'right') {
        ball.velocity.x = abs(ball.velocity.x); // Move right
      }
    }

    // Remove destroyed bricks from the array
    bricks = bricks.filter((brick) => !brick.isDestroyed());

    // Use fingertip coordinates to control mirrored paddle movement if handpose is enabled
    if (predictions.length > 0) {
      const prediction = predictions[0];
      const indexFingerTip = prediction.annotations.indexFinger[3];

      // Mirror the movement based on the width of the canvas
      const mirroredX = width - map(indexFingerTip[0], 0, width, 0, width);
      paddle.pos.x = map(mirroredX, 0, width, -width / 2, width / 2);
    }

    // Handle collisions with the paddle
    if (ball.hits(paddle)) {
      ball.reverse('y');
    }

    // Handle game over due to losing a life
    if (ball.pos.y > paddle.pos.y + ball.radius) {
      loseLife();
      deathSound();
    }

    if (cameraShake) {
      applyCameraShake();
    }
    
    // Translate the entire scene to simulate camera shake
    translate(cameraXOffset, cameraYOffset);

    // Check for win condition
    if (bricks.length === 0) {
      if (currentRound < totalRounds) {
        // Proceed to the next round
        currentRound++;
        lives++;
        increaseDifficulty();
        createBricks();
        resetBall();
      } else {
        // All rounds are completed, the game is won
        gameOver();
      }
    }

    // Display the current round, score, and lives in the middle under the bricks
    displayRoundScoreAndLives();

    // Display and update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update();
      particle.display();

      // Remove particles when they are finished
      if (particle.isFinished()) {
        particles.splice(i, 1);
      }
    }
  } else if (gameState === 'gameover') {
    if (temp == 0){
      score += (bonusPoints*lives);
      temp++;
    }
    background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(`Game Over`, 0, -50);
  text(`Final Score: ${score}`,  0, 0);
    textSize(16);
    text('Press "R" to restart',  0, 100);
  }
}

function resetCamera() {
  cameraXOffset = 0;
  cameraYOffset = 0;
}

function applyCameraShake() {
  if (shakeFrames > 0) {
    // Apply random offsets to the camera position
    cameraXOffset = random(-shakeIntensity, shakeIntensity);
    cameraYOffset = random(-shakeIntensity, shakeIntensity);
    shakeFrames--;
  } else {
    // Reset camera position after shake duration
    resetCamera();
    shakeFrames = shakeDuration;
    cameraShake = false;
  }
}

function setupGUI() {
  
  // Create color pickers for background, ball, and paddle colors
  backgroundColorPicker = createColorPicker(color(50, 100, 200));
  ballColorPicker = createColorPicker(color(204, 20, 10));
  paddleColorPicker = createColorPicker(color(255, 255, 255));

  // Position the color pickers
  backgroundColorPicker.position(50, height+20);
  ballColorPicker.position(50, height+80);
  paddleColorPicker.position(50, height+140);

  // Create buttons to apply the selected colors
  backgroundButton = createButton('Set Background Color');
  ballButton = createButton('Set Ball Color');
  paddleButton = createButton('Set Paddle Color');

  // Position the buttons
  backgroundButton.position(150, height+20);
  ballButton.position(150, height+80);
  paddleButton.position(150, height+140);

  // Set button callbacks
  backgroundButton.mousePressed(setBackgroundColor);
  ballButton.mousePressed(setBallColor);
  paddleButton.mousePressed(setPaddleColor);
  
}

function setBackgroundColor() {
  const bgColor = backgroundColorPicker.color();
  background(bgColor);
  bgCol = bgColor;
}

function setBallColor() {
  const ballColor = ballColorPicker.color();
  ball.setColor(ballColor);
}

function setPaddleColor() {
  const paddleColor = paddleColorPicker.color();
  paddle.setColor(paddleColor);
}

function keyPressed() {
  if (gameState === 'start' && keyCode === ENTER) {
    // Start the game when Enter is pressed
    startGame();
  } else if (gameState === 'start' && key === 'c' || key === 'C') {
    // Toggle chaos mode when 'C' key is pressed
    chaos = !chaos;
    chaosText = chaos ? '(C) Chaos Mode: Enabled' : '(C) Chaos Mode: Disabled';
  }
  else if (gameState === 'gameover' && key === 'r' || key === 'R') {
    restartGame();
  }

}

function startGame() {
  gameState = 'play';
}

function displayRoundScoreAndLives() {
  fill(roundColors[currentRound - 1]);
  stroke(255);
  strokeWeight(4);
  textSize(24);
  textAlign(CENTER, TOP);
  text(`Round: ${currentRound} / ${totalRounds}`, 0, height / 2 - 175);
  text(`Score: ${score}`, 0, height / 2 - 150);
  text(`Lives: ${lives}`, 0, height / 2 - 125);
}

function loseLife() {
  lives--;
  if (lives <= 0) {
    gameOver(); // Player is out of lives
  } else {
    resetBall(); // Reset the ball and continue playing
  }
}
class Brick {
  constructor(x, y, z, width, height, depth, color, isSpecial) {
    this.pos = createVector(x, y, z);
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.destroyed = false;
    this.color = color;
    this.isSpecial = isSpecial; // Indicates if this brick is special
  }

  display() {
    if (!this.destroyed) {
      push();
      translate(this.pos.x, this.pos.y, this.pos.z);
      // fill(this.color); // Set the color of the brick
      ambientMaterial(this.color);
      specularMaterial(100, 255, 255);
      shininess(100);

      box(this.width, this.height, this.depth); // Assuming bricks are 3D boxes
      pop();
    }
  }

  isDestroyed() {
    return this.destroyed;
  }

  destroy() {
    this.destroyed = true;
    
  }
}
class SpecialBrick {
  constructor(x, y, z, diameter, effect, points) {
    this.pos = createVector(x, y, z);
    this.diameter = diameter;
    this.effect = effect;
    this.points = points;
    this.destroyed = false;
    this.angle = 0;
    this.color = this.getColorForEffect(); // Dynamically set color based on the effect
    this.special = true;
  }

  getColorForEffect() {
    // Define colors based on different effects
    switch (this.effect) {
      case 'life':
        return color(255, 0, 0); // Red for 'life'
      case 'points':
        return color(255, 255, 0); // Yellow for 'points'
      case 'power':
        return color(0, 0, 255); // Blue for 'power'
      default:
        return color(255); // Default color
    }
  }

  display() {
    if (!this.destroyed) {
      push();
      translate(this.pos.x, this.pos.y, this.pos.z);
      rotateY(this.angle);
      noStroke();
      ambientMaterial(this.color);
      specularMaterial(100, 255, 255);
      shininess(20);
      sphere(this.diameter);
      this.angle += 0.01;
      pop();
    }
  } 

  isDestroyed() {
    return this.destroyed;
  }

  destroy() {
    this.destroyed = true;
    if (this.effect)
    
    switch (this.effect) {
      case 'life':
        lives++;
        break;
      case 'points':
        increaseScore(150);
        break;
      case 'power':
        cameraShake = true;
        destroyNeighboringBricks(this);
        break;
      default:
        
    }
    
  }
}



function createBricks() {
  // Clear the bricks array for the new round
  bricks = [];

  const brickWidth = 60;
  const brickHeight = 20;
  const brickDepth = 20;
  const rows = 5;
  const cols = 8;

  // Increase points per brick as rounds get harder
  pointsPerBrick = 10 + (currentRound - 1) * 5;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = j * (brickWidth + 10) - ((cols - 1) * (brickWidth + 10)) / 2;
      const y = i * (brickHeight + 10) - 160;
      const z = 0; // Adjust as needed for 3D placement

      // Randomly decide if this brick is the special brick (5% chance)
      if (chaos == true){
        isSpecial = 1;
      } else {
        isSpecial = random(1) < 0.05;
        
      }

      let brick;

      if (isSpecial) {
        const specialSize = 15; // Random sizes for special brick
        const effect = getRandomEffect(); // Get a random effect
        brick = new SpecialBrick(x, y, z, specialSize, effect, 10);
        bricks.push(brick); // Add the special brick to the bricks array
      } else if (chaos){

      } else {
        brick = new Brick(
          x,
          y,
          z,
          brickWidth,
          brickHeight,
          brickDepth,
          roundColors[currentRound - 1],
          false
        );
        bricks.push(brick); // Add normal brick to the bricks array
      }
    }
  }
}

function getRandomEffect() {
  const effects = ['life', 'points', 'power']; // Add more effects if needed
  return random(effects);
}


function increaseScore(points) {
  score += points;
}

function increaseDifficulty() {
  // Increase ball and paddle speed for added difficulty
  ball.increaseSpeed();
  paddle.increaseSpeed();
}

function resetBall() {
  ball.reset();
}

class Paddle {
  constructor(x, y, z) {
    this.pos = createVector(x, y, z);
    this.width = 100;
    this.height = 20;
    this.depth = 100;
    this.speed = 5;
    this.color = [0,0,0,100];
  }
      setColor(newColor) {
    this.color = newColor;
    }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);

    // Change the material of the ball to a shiny white sphere
    ambientMaterial(this.color);
    specularMaterial(255, 255, 255);
    shininess(50);

    box(this.width, this.height, this.depth);
    pop();
  }

  update() {
    // Update the paddle's position based on user input or other logic
    if (keyIsDown(LEFT_ARROW) && this.pos.x > -width / 2 + 50) {
      this.pos.x -= this.speed;
    } else if (keyIsDown(RIGHT_ARROW) && this.pos.x < width / 2 - this.width + 50) {
      this.pos.x += this.speed;
    }
  }

  increaseSpeed() {
    this.speed++;
  }
  

}

class Ball {
  constructor() {
    this.pos = createVector(0, 0);
    this.radius = 10;
    this.velocity = createVector(4, -4); // Initial velocity
    this.color = [255,0,0,100];
  }
    setColor(newColor) {
    this.color = newColor;
  }
  hitsPaddleSide(paddle) {
    // Check if the ball hits the left or right side of the paddle
    if (this.pos.y + this.radius >= paddle.pos.y - paddle.height / 2 &&
      this.pos.y - this.radius <= paddle.pos.y + paddle.height / 2) {
      if (this.pos.x >= paddle.pos.x - paddle.width / 2 && this.pos.x <= paddle.pos.x) {
        return 'left';
      } else if (this.pos.x <= paddle.pos.x + paddle.width / 2 && this.pos.x >= paddle.pos.x) {
        return 'right';
      }
    }
    return null;
  }

  update() {
    this.pos.x += this.velocity.x;
    this.pos.y += this.velocity.y;

    // Check for collisions with walls and reverse the ball's velocity
    if (this.pos.x < -width / 2 + this.radius || this.pos.x > width / 2 - this.radius) {
      this.velocity.x *= -1;
      deathSound();
    }
    if (this.pos.y < -height / 2 + this.radius || this.pos.y > height / 2 - this.radius) {
      this.velocity.y *= -1;
      deathSound();
    }
    ballTrail.push(createVector(this.pos.x, this.pos.y));
    if (ballTrail.length > trailLength) {
      ballTrail.shift(); // Remove older positions to maintain trail length
}
  }

  hits(object) {
    // Check for collision with the given object (e.g., paddle or brick)
    const distanceX = abs(this.pos.x - object.pos.x) - object.width / 2;
    const distanceY = abs(this.pos.y - object.pos.y) - object.height / 2;
    if (object instanceof SpecialBrick) {
      const distance = p5.Vector.dist(this.pos, object.pos);
      if (distance <= this.radius + object.diameter / 2) {
        bounceSound();
        return true;
      }
    }
    else if (distanceX <= this.radius && distanceY <= this.radius) {
      bounceSound();
      return true;
    }

    return false;
  }

  reverse(axis) {
    // Reverse the ball's velocity on the specified axis (e.g., 'x' or 'y')
    if (axis === 'x') {
      this.velocity.x *= -1;
    } else if (axis === 'y') {
      this.velocity.y *= -1;
    }
  }


  display() {
    
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();

    // Change the material of the ball to a shiny white sphere
    ambientMaterial(this.color);
    specularMaterial(100, 255, 255);
    shininess(50);
    

    sphere(this.radius);
    pop();

    for (let i = ballTrail.length - 1; i >= 0; i--) {
      const trailOpacity = 255 - (ballTrail.length - 1 - i) * trailOpacityDecay; // Decrease opacity for each segment
      const diameter = map(i, 0, ballTrail.length - 1, 0, this.radius * 2); // Increase size for each segment (reverse mapping)
      const alpha = constrain(trailOpacity, 0, 255); // Ensure opacity remains within valid range
      
      push();
      translate(ballTrail[i].x, ballTrail[i].y);
      noStroke();
      fill(this.color[0], this.color[1], this.color[2], alpha);
      if (diameter>0){
        ellipse(0, 0, diameter, diameter);
                     }
      pop();
    }
  }

  increaseSpeed() {
    this.velocity.x += 1;
    this.velocity.y += 1;
  }

  reset() {
    this.pos = createVector(0, 0);
    this.velocity = createVector(4, -4); // Initial velocity
  }
  
}


class Particle {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(random(1, 5)); // Random initial velocity
    this.color = color;
    this.alpha = 255; // Initial alpha value for fading effect
  }

  display() {
    this.alpha -= 5; // Reduce alpha for fading effect
    push();
    translate(this.pos.x, this.pos.y);
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    noStroke();
    ellipse(0, 0, 5, 5); // Adjust the particle appearance
    pop();
  }

  update() {
    this.pos.add(this.velocity);
  }

  isFinished() {
    return this.alpha <= 0;
  }
}

function destroyNeighboringBricks(specialBrick) {
  // Iterate through all bricks and find those that are neighbors of the special brick
  for (let brick of bricks) {
    if (!brick.isDestroyed() && !(brick instanceof SpecialBrick)) {
      const distance = p5.Vector.dist(brick.pos, specialBrick.pos);

      // Check if the brick is within a certain distance from the special brick
      if (distance < specialBrick.diameter * 5.5) {
        brick.destroy(); // Mark the brick as destroyed
        increaseScore(pointsPerBrick);
      }
    }
  }

  // Remove the destroyed bricks from the array
  bricks = bricks.filter((brick) => !brick.isDestroyed());
}


function bounceSound() {
  userStartAudio();

  let note = random(['Fb4']);
  // note velocity (volume, from 0 to 1)
  let velocity = random();
  // time from now (in seconds)
  let time = 0;
  // note duration (in seconds)
  let dur = 1/6;

  monoSynth.play(note, velocity, time, dur);
}

function deathSound() {
  userStartAudio();

  let note = random(['B2']);
  // note velocity (volume, from 0 to 1)
  let velocity = random();
  // time from now (in seconds)
  let time = 0;
  // note duration (in seconds)
  let dur = 1/6;

  monoSynth.play(note, velocity, time, dur);
}

let restartButton; // Declare the button globally

function gameOver() {
  gameState = 'gameover';
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(`Game Over`, 0, -50);
}

function restartGame() {
  // Reset game variables and restart the game
  score = 0;
  currentRound = 1;
  lives = 3;
  gameState = 'start';
  createBricks();
  resetBall();
  temp = 0;
}