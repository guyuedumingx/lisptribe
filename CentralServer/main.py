import sys
sys.path.append("./interpreter")

import interpreter.stepA_mal as interpreter
# from math import *
interpreter.REP("(load-file \"../init.mal\")")
interpreter.REP("(load-file \"init.mal\")")
interpreter.server("localhost", 1234)

