if (typeof module !== 'undefined') {
    var types = require('./types');
    // var readline = require('./node_readline');
    var readline = require('readline');
    var reader = require('./reader');
    var printer = require('./printer');
    var Env = require('./env').Env;
    var core = require('./core');
    var EventEmitter = require('events');   var net = require('net')
}

// read
function READ(str) {
    return reader.read_str(str);
}

// eval
function qqLoop (acc, elt) {
    if (types._list_Q(elt) && elt.length
        && types._symbol_Q(elt[0]) && elt[0].value == 'splice-unquote') {
        return [types._symbol("concat"), elt[1], acc];
    } else {
        return [types._symbol("cons"), quasiquote (elt), acc];
    }
}
function quasiquote(ast) {
    if (types._list_Q(ast) && 0<ast.length
        && types._symbol_Q(ast[0]) && ast[0].value == 'unquote') {
        return ast[1];
    } else if (types._list_Q(ast)) {
        return ast.reduceRight(qqLoop,[]);
    } else if (types._vector_Q(ast)) {
        return [types._symbol("vec"), ast.reduceRight(qqLoop,[])];
    } else if (types._symbol_Q(ast) || types._hash_map_Q(ast)) {
        return [types._symbol("quote"), ast];
    } else {
        return ast;
    }
}

function is_macro_call(ast, env) {
    return types._list_Q(ast) &&
           types._symbol_Q(ast[0]) &&
           env.find(ast[0]) &&
           env.get(ast[0])._ismacro_;
}

function macroexpand(ast, env) {
    while (is_macro_call(ast, env)) {
        var mac = env.get(ast[0]);
        ast = mac.apply(mac, ast.slice(1));
    }
    return ast;
}

function eval_ast(ast, env) {
    if (types._symbol_Q(ast)) {
        return env.get(ast);
    } else if (types._list_Q(ast)) {
        return ast.map(function(a) { return EVAL(a, env); });
    } else if (types._vector_Q(ast)) {
        var v = ast.map(function(a) { return EVAL(a, env); });
        v.__isvector__ = true;
        return v;
    } else if (types._hash_map_Q(ast)) {
        var new_hm = {};
        for (k in ast) {
            new_hm[k] = EVAL(ast[k], env);
        }
        return new_hm;
    } else {
        return ast;
    }
}

function _EVAL(ast, env) {
    while (true) {

    //printer.println("EVAL:", printer._pr_str(ast, true));
    if (!types._list_Q(ast)) {
        return eval_ast(ast, env);
    }

    // apply list
    ast = macroexpand(ast, env);
    if (!types._list_Q(ast)) {
        return eval_ast(ast, env);
    }
    if (ast.length === 0) {
        return ast;
    }

    var a0 = ast[0], a1 = ast[1], a2 = ast[2], a3 = ast[3];
    switch (a0.value) {
    case "def!":
        var res = EVAL(a2, env);
        return env.set(a1, res);
    case "let*":
        var let_env = new Env(env);
        for (var i=0; i < a1.length; i+=2) {
            let_env.set(a1[i], EVAL(a1[i+1], let_env));
        }
        ast = a2;
        env = let_env;
        break;
    case "quote":
        return a1;
    case "quasiquoteexpand":
        return quasiquote(a1);
    case "quasiquote":
        ast = quasiquote(a1);
        break;
    case 'defmacro!':
        var func = types._clone(EVAL(a2, env));
        func._ismacro_ = true;
        return env.set(a1, func);
    case 'macroexpand':
        return macroexpand(a1, env);
    case "try*":
        try {
            return EVAL(a1, env);
        } catch (exc) {
            if (a2 && a2[0].value === "catch*") {
                if (exc instanceof Error) { exc = exc.message; }
                return EVAL(a2[2], new Env(env, [a2[1]], [exc]));
            } else {
                throw exc;
            }
        }
    case "do":
        eval_ast(ast.slice(1, -1), env);
        ast = ast[ast.length-1];
        break;
    case "if":
        var cond = EVAL(a1, env);
        if (cond === null || cond === false) {
            ast = (typeof a3 !== "undefined") ? a3 : null;
        } else {
            ast = a2;
        }
        break;
    case "fn*":
        return types._function(EVAL, Env, a2, env, a1);
    default:
        var el = eval_ast(ast, env), f = el[0];
        if (f.__ast__) {
            ast = f.__ast__;
            env = f.__gen_env__(el.slice(1));
        } else {
            return f.apply(f, el.slice(1));
        }
    }

    }
}

function EVAL(ast, env) {
    var result = _EVAL(ast, env);
    return (typeof result !== "undefined") ? result : null;
}

// print
function PRINT(exp) {
    return printer._pr_str(exp, true);
}

// repl
var repl_env = new Env();
var rep = function(str) { return PRINT(EVAL(READ(str), repl_env)); };

// core.js: defined using javascript
for (var n in core.ns) { repl_env.set(types._symbol(n), core.ns[n]); }
repl_env.set(types._symbol('eval'), function(ast) {
    return EVAL(ast, repl_env); });
repl_env.set(types._symbol('*ARGV*'), []);

// core.mal: defined using the language itself
rep("(def! *host-language* \"javascript\")")
rep("(def! not (fn* (a) (if a false true)))");
rep("(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\nnil)\")))))");
rep("(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))");


const emitter1 = new EventEmitter();
function send_msg(env, exp="") {
    sendMessage(env, exp);
    emitter1.once('data', data => {
        console.log(data);
    })
    // return new Promise(resolve => {
    // })
}

function sendMessage(env, exp = "") {
    exp = printer._pr_str(exp)
    let client_socket = new net.Socket();
    client_socket.connect(env[1], env[0]);
    client_socket.write(exp.toString());

    client_socket.on('data', (msg) => {
        emitter1.emit('data', msg.toString())
    });
}

export function run_command(line) {
    try {
        if (line) { return rep(line); }
    } catch (exc) {
        if (exc instanceof reader.BlankException) {
            return ""; 
            }
        if (exc instanceof Error) { 
            return exc.stack
        }
        else { 
            return "Error: " + exc
        }
    }
}

function server(host, port=8124) {
    const socket = net.createServer((socket) => {
        console.log(`(${socket.remoteAddress}:${socket.remotePort})`);
        const emitter = new EventEmitter();

        emitter.on('data', (data) => {
            console.log("Exp: " + data.toString());
            let response = run_command(data.toString())
            console.log("Result: " + response);
            socket.write(response);
        });

        socket.on('data', (data) => {
            emitter.emit('data', data);
        });
    });

    socket.on('error', (err) => {
        console.log(err);
    });

    socket.listen(port, host, () => {
        console.log('Server run at: ' + port);
    });
}

function repl(prompt=">>> ") {
    if (typeof process !== 'undefined' && process.argv.length > 2) {
        repl_env.set(types._symbol('*ARGV*'), process.argv.slice(3));
        rep('(load-file "' + process.argv[2] + '")');
        process.exit(0);
    }

    rep("(println (str \"Mal [\" *host-language* \"]\"))");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.setPrompt(prompt);
    rl.prompt()
    rl.on('line',(line) => {
        if (line === null) { 
            rl.close();
        }
        try {
            if (line) { printer.println(rep(line)); }
        } catch (exc) {
            if (exc instanceof Error) { console.warn(exc.stack) }
            else { console.warn("Error: " + printer._pr_str(exc, true)) }
        }
        rl.prompt()
    })
}

function load_lib(file_path) {
    let mod = require(file_path.replace(/\.[^/.]+$/, ""));
    Object.entries(mod).forEach(([key, value]) => {
        if (typeof value === 'function') {
            console.log(key)
            repl_env.set(types._symbol(key.replace(/_/g, "-")), value)
        }
    })
}

repl_env.set(types._symbol('send-msg'),send_msg)
repl_env.set(types._symbol('server'), server)
repl_env.set(types._symbol('repl'), repl)
repl_env.set(types._symbol('global-symbols-string'), ()=> {return Object.entries(repl_env.data).map(([key, value]) => key)})
repl_env.set(types._symbol('exit'), process.exit)
repl_env.set(types._symbol('load-lib'), load_lib)

// export {
//     repl_env,
//     server,
//     repl,
//     rep,
//     run_command
// }

// repl()