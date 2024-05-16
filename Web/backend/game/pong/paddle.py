WIDTH = 640
HEIGHT = 480

class Paddle:
    MOUVEMENT_SPEED = 2.55
    PLAYER_HEIGHT = 144
    PLAYER_WIDTH = 10

    def __init__(self, x, y):
        self.x = self.original_x = x
        self.y = self.original_y = y

    def move(self, up=True):
        if up and self.y - self.MOUVEMENT_SPEED > 0:
            self.y -= self.MOUVEMENT_SPEED
        elif not up and self.y + self.MOUVEMENT_SPEED + (self.PLAYER_HEIGHT / 2) < HEIGHT:
            self.y += self.MOUVEMENT_SPEED

    def reset(self):
        self.x = self.original_x
        self.y = self.original_y
        
