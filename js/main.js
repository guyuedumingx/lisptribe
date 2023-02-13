var interpreter = require("./interpreter/stepA_mal");

interpreter.rep("(load-file \"../init.mal\")")
interpreter.repl()
