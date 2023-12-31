# Wreck-It-Realms
https://editor.p5js.org/MatthewBoden/sketches/rLZAHN1TM

Wreck-It Realms" is an interactive 3D breakout game where the user controls the paddle and tries to destroy all the floating bricks with a bouncing ball
The user is able to control the paddle in two different ways. The first way is using the
handpose model and the program tracks the users figer through the camera to move the
paddle from left to right. The second way is using the left and right arrows on the keyboard.
When the ball hits the paddle on the left side then the ball is hit to the left side of the screen,
the opposite happens for the right side. This allows the user to control where they want the ball
to go. Once a brick is destroyed, the user gains 10 points and there are 2 types of bricks
(Normal and Special Bricks).
There are two different gamemodes, the first is regular where a special brick has a 5%
chance of spawning. The second is Chaos mode where the special brick has a 100% chance
of spawning. There are 3 types of special bricks. The first is Power (Blue Sphere) which breaks
all the normal bricks surrounding it and shakes the screen. The second is Points (Yellow
Sphere) which gives the user bonus points. The final special brick is Lives (Red Sphere) which
gives the user an extra life. Each game starts with 3 lives and an extra life is also granted upon
the completion of a round as well as the speed of the paddle and ball are increased. Extra lives
left at the end of the game gets bonus points for a higher score.
The game is over if the user destroys every brick for all 5 rounds or there are no more
lives left. During the gameover screen, the user can press “r” to restart and go back to the start
screen. Once on the start screen, the user can press “enter” to start the game so the program
does not begin on startup. The user is able to change gamemodes during the start screen by
pressing the letter “c”. The user is able to customize the colours of each element such as the
ball, paddle, and background during anytime with the GUI below the screen. The bricks have a
custom preset colour that is determined based on what round it is.
