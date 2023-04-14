// IMPORTANT: choose one
var RL_LIB = "libreadline";  // NOTE: libreadline is GPL
//var RL_LIB = "libedit";
import ffi from "ffi-napi";
import fs from "fs";
import path from "path";

// var HISTORY_FILE = require('path').join(process.env.HOME, '.mal-history');
var HISTORY_FILE = path.join("./", '.mal-history');
// var HISTORY_FILE = './.mal_history'

var rlwrap = {}; // namespace for this module in web context

var rllib = ffi.Library(RL_LIB, {
    'readline':    [ 'string', [ 'string' ] ],
    'add_history': [ 'int',    [ 'string' ] ]});

var rl_history_loaded = false;

rlwrap.readline = function(prompt) {
    prompt = typeof prompt !== 'undefined' ? prompt : "user> ";

    if (!rl_history_loaded) {
        rl_history_loaded = true;
        var lines = [];
        if (fs.existsSync(HISTORY_FILE)) {
            lines = fs.readFileSync(HISTORY_FILE).toString().split("\n");
        }
        // Max of 2000 lines
        lines = lines.slice(Math.max(lines.length - 2000, 0));
        for (var i=0; i<lines.length; i++) {
            if (lines[i]) { rllib.add_history(lines[i]); }
        }
    }

    var line = rllib.readline(prompt);
    if (line) {
        rllib.add_history(line);
        try {
            fs.appendFileSync(HISTORY_FILE, line + "\n");
        } catch (exc) {
            // ignored
        }
    }

    return line;
};

export default rlwrap;