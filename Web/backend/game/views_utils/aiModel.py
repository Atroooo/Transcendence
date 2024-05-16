import neat
import os
import pickle
import time

def openPickle(level):
    local_dir = os.path.dirname(__file__)
    config_path = os.path.join(local_dir, 'config.txt')
    config = neat.Config(neat.DefaultGenome, neat.DefaultReproduction,
                         neat.DefaultSpeciesSet, neat.DefaultStagnation,
                         config_path)
    
    if (level == 1):
        with open(os.path.join(local_dir, "lvl1.pickle"), "rb") as f:
            AI = pickle.load(f)
    else:
        with open(os.path.join(local_dir, "lvl2.pickle"), "rb") as f:
            AI = pickle.load(f)
    return (neat.nn.FeedForwardNetwork.create(AI, config))

def getMove(level, playerX, playerY, ballX, ballY):
    ai_instance = openPickle(level)
    output = ai_instance.activate((playerY, abs(playerX - ballX), ballY))
    decision = output.index(max(output))
    return decision

def isFloat(str):
    try:
        float(str)
        return True
    except ValueError:
        return False

def isInt(str):
    try:
        int(str)
        return True
    except ValueError:
        return False