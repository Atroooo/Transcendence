import random

class Ball():
    RADIUS = 5
        
    def __init__(self, window_width, window_height):
        
        self.window_width = window_width
        self.window_height = window_height
        
        self.x = window_width / 2
        self.y = window_height / 2
        self.initBallSpeed()
    
    def resetBall(self):
        self.x = self.window_width / 2
        self.y = self.window_height / 2
        self.initBallSpeed()
    
    def initBallSpeed(self):
        side = 1 if random.random() < 0.5 else -1
        self.speedX = 2.00 * side
        self.speedY = 0.0
        
    def move(self):
        self.x += self.speedX
        self.y += self.speedY