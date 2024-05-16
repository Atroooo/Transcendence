from .ball import Ball
from .paddle import Paddle

import time

WIDTH = 640
HEIGHT = 480

PLAYER_HEIGHT = 144
PLAYER_WIDTH = 10
PLAYER_START_X = 10

MAX_SPEED = 10
SPEED_INCREMENT = 0.5


class Game():
    def __init__(self):
        self.scoreP1 = 0
        self.scoreP2 = 0
        
        self.left_paddle = Paddle(PLAYER_START_X, HEIGHT / 2)
        self.right_paddle = Paddle(WIDTH - PLAYER_START_X, HEIGHT / 2)
        
        self.ball = Ball(WIDTH, HEIGHT)
        
        self.left_hit = 0
        self.right_hit = 0
        
        self.hitting_zone = []
        
        self.score_timeP1 = []
        self.score_timeP2 = []
        
        self.start = time.time()
        self.end = 0
            
    def game_loop(self):
        self.handleCollision()

        if (self.ball.x < 0):
            self.updateScore("p1")
        if (self.ball.x > WIDTH):
            self.updateScore("p2")

        self.ball.move()
        
    def changeDirection(self, direction):
        if (direction == "left"):
            impact = self.ball.y - self.left_paddle.y
            side = 1 if self.left_paddle.y < self.ball.y else -1
        if (direction == "right"):
            impact = self.ball.y - self.right_paddle.y
            side = 1 if self.right_paddle.y < self.ball.y else -1

        if (impact < 10 and impact > -10):
            impact = 15 if impact > 0 else -15

        ratio = (100 / (PLAYER_HEIGHT / 2))
        self.ball.speedY = (impact * ratio / 80)

        if (side == 1 and self.ball.speedY < 0 or side == -1 and self.ball.speedY > 0):
            self.ball.speedY *= -1
        self.ball.speedX *= -1
            
    def handleCollision(self):
        if (self.ball.y < 0 or self.ball.y > HEIGHT):
            self.ball.speedY *= -1
            
        if self.ball.speedX < 0:
            if (self.ball.x + self.ball.RADIUS <= self.left_paddle.x + PLAYER_WIDTH):
                if (self.ball.y + self.ball.RADIUS <= self.left_paddle.y + PLAYER_HEIGHT / 2 and self.ball.y >= self.left_paddle.y - PLAYER_HEIGHT / 2):
                    if (self.ball.speedX > -MAX_SPEED):
                        self.ball.speedX -= SPEED_INCREMENT
                    self.addHittingZone("p1", self.ball.x, self.ball.y)
                    self.left_hit += 1
                    self.changeDirection("left")
        else:
            if (self.ball.x - self.ball.RADIUS >= self.right_paddle.x - PLAYER_WIDTH):
                if (self.ball.y + self.ball.RADIUS <= self.right_paddle.y + PLAYER_HEIGHT / 2 and self.ball.y >= self.right_paddle.y - PLAYER_HEIGHT / 2):
                    if (self.ball.speedX < MAX_SPEED):
                        self.ball.speedX += SPEED_INCREMENT
                    self.addHittingZone("p2", self.ball.x, self.ball.y)
                    self.right_hit += 1
                    self.changeDirection("right")
            
    def updatePlayerPos(self, player, direction):
        if (player == "p1"):
            if (direction == "down"):
                self.left_paddle.move(False)
            else:
                self.left_paddle.move(True)
        else:
            if (direction == "down"):
                self.right_paddle.move(False)
            else:
                self.right_paddle.move(True)
    
    def updateScore(self, player):
        if (player == "p1"):
            self.scoreP1 += 1
        else:
            self.scoreP2 += 1
        self.end = time.time()
        self.saveScoreTime(player)
        self.resetRound()
    
    def addHittingZone(self, player, x, y):
        coords = player +":" + str(x) + ',' + str(y)
        self.hitting_zone.append(coords)
    
    def saveScoreTime(self, player):
        if (player == "p1"):
            self.score_timeP1.append(str(time.time() - self.start))
        else:
            self.score_timeP2.append(str(time.time() - self.start))
    
    def resetScore(self):
        self.scoreP1 = 0
        self.scoreP2 = 0        
    
    def resetRound(self):
        self.ball.resetBall()
        
        self.left_paddle.reset()
        self.right_paddle.reset()
                    
    def getScore(self):
        return self.scoreP1, self.scoreP2
    
    def getCoords(self):
        self.game_loop()
        return (self.ball.x, self.ball.y)

    def getNbHit(self):
        return self.left_hit, self.right_hit
    
    def getHittingZone(self):
        return self.hitting_zone
    
    def getGameLength(self):
        return self.end - self.start
    
    def getScoreTime(self):
        return self.score_timeP1, self.score_timeP2
    
    def setWinningScore(self, player):
        if (player == "p1"):
            self.scoreP1 = 5
        else:
            self.scoreP2 = 5