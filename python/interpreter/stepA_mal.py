import functools
import sys, traceback
import mal_readline
import mal_types as types
import reader, printer
from env import Env
import core
import socket
import importlib
import os


# read
def READ(str):
    return reader.read_str(str)

# eval
def qq_loop(acc, elt):
    if types._list_Q(elt) and len(elt) == 2 and elt[0] == u'splice-unquote':
        return types._list(types._symbol(u'concat'), elt[1], acc)
    else:
        return types._list(types._symbol(u'cons'), quasiquote(elt), acc)

def qq_foldr(seq):
    return functools.reduce(qq_loop, reversed(seq), types._list())

def quasiquote(ast):
    if types._list_Q(ast):
        if len(ast) == 2 and ast[0] == u'unquote':
            return ast[1]
        else:
            return qq_foldr(ast)
    elif types._hash_map_Q(ast) or types._symbol_Q(ast):
        return types._list(types._symbol(u'quote'), ast)
    elif types._vector_Q (ast):
        return types._list(types._symbol(u'vec'), qq_foldr(ast))
    else:
        return ast

def is_macro_call(ast, env):
    return (types._list_Q(ast) and
            types._symbol_Q(ast[0]) and
            env.find(ast[0]) and
            hasattr(env.get(ast[0]), '_ismacro_'))

def macroexpand(ast, env):
    while is_macro_call(ast, env):
        mac = env.get(ast[0])
        ast = mac(*ast[1:])
    return ast

def eval_ast(ast, env):
    if types._symbol_Q(ast):
        return env.get(ast)
    elif types._list_Q(ast):
        return types._list(*map(lambda a: EVAL(a, env), ast))
    elif types._vector_Q(ast):
        return types._vector(*map(lambda a: EVAL(a, env), ast))
    elif types._hash_map_Q(ast):
        return types.Hash_Map((k, EVAL(v, env)) for k, v in ast.items())
    else:
        return ast  # primitive value, return unchanged

def EVAL(ast, env):
    while True:
        #print("EVAL %s" % printer._pr_str(ast))
        if not types._list_Q(ast):
            return eval_ast(ast, env)

        # apply list
        ast = macroexpand(ast, env)
        if not types._list_Q(ast):
            return eval_ast(ast, env)
        if len(ast) == 0: return ast
        a0 = ast[0]

        if "def!" == a0:
            a1, a2 = ast[1], ast[2]
            res = EVAL(a2, env)
            return env.set(a1, res)
        elif "let*" == a0:
            a1, a2 = ast[1], ast[2]
            let_env = Env(env)
            for i in range(0, len(a1), 2):
                let_env.set(a1[i], EVAL(a1[i+1], let_env))
            ast = a2
            env = let_env
            # Continue loop (TCO)
        elif "quote" == a0:
            return ast[1]
        elif "quasiquoteexpand" == a0:
            return quasiquote(ast[1]);
        elif "quasiquote" == a0:
            ast = quasiquote(ast[1]);
            # Continue loop (TCO)
        elif 'defmacro!' == a0:
            func = types._clone(EVAL(ast[2], env))
            func._ismacro_ = True
            return env.set(ast[1], func)
        elif 'macroexpand' == a0:
            return macroexpand(ast[1], env)
        elif "py!*" == a0:
            exec(compile(ast[1], '', 'single'), globals())
            return None
        elif "py*" == a0:
            return types.py_to_mal(eval(ast[1]))
        elif "." == a0:
            el = eval_ast(ast[2:], env)
            f = eval(ast[1])
            return f(*el)
        elif "try*" == a0:
            if len(ast) < 3:
                return EVAL(ast[1], env)
            a1, a2 = ast[1], ast[2]
            if a2[0] == "catch*":
                err = None
                try:
                    return EVAL(a1, env)
                except types.MalException as exc:
                    err = exc.object
                except Exception as exc:
                    err = exc.args[0]
                catch_env = Env(env, [a2[1]], [err])
                return EVAL(a2[2], catch_env)
            else:
                return EVAL(a1, env);
        elif "do" == a0:
            eval_ast(ast[1:-1], env)
            ast = ast[-1]
            # Continue loop (TCO)
        elif "if" == a0:
            a1, a2 = ast[1], ast[2]
            cond = EVAL(a1, env)
            if cond is None or cond is False:
                if len(ast) > 3: ast = ast[3]
                else:            ast = None
            else:
                ast = a2
            # Continue loop (TCO)
        elif "fn*" == a0:
            a1, a2 = ast[1], ast[2]
            return types._function(EVAL, Env, a2, env, a1)
        else:
            el = eval_ast(ast, env)
            f = el[0]
            if hasattr(f, '__ast__'):
                ast = f.__ast__
                env = f.__gen_env__(el[1:])
            else:
                return f(*el[1:])

# print
def PRINT(exp):
    return printer._pr_str(exp)

# repl
repl_env = Env()
def REP(str):
    return PRINT(EVAL(READ(str), repl_env))

# core.py: defined using python
for k, v in core.ns.items(): repl_env.set(types._symbol(k), v)
repl_env.set(types._symbol('eval'), lambda ast: EVAL(ast, repl_env))
repl_env.set(types._symbol('*ARGV*'), types._list(*sys.argv[2:]))

# core.mal: defined using the language itself
REP("(def! *host-language* \"python\")")
REP("(def! not (fn* (a) (if a false true)))")
REP("(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\nnil)\")))))")
REP("(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))")


def send_msg(env, msg, wait=True):
    exp = printer._pr_str(msg)
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((env[0], env[1]))
    client_socket.sendall(exp.encode('utf-8'))
    if wait:
        data = b'' 
        while True:
            msg = client_socket.recv(1024)
            data += msg
            if len(data) < 1024:
                client_socket.close()
                break
        return data.decode('utf-8')
    else: 
        return ""

def run_command(line):
    try:
        return REP(line)
    except reader.Blank: return "" 
    except types.MalException as e:
        # return "Error:", printer._pr_str(e.object)
        return "Error: "+ e.object
    except Exception as e:
        return str("Exception: "+ str(e))

def server(host, port):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(5)
    # print("Server run at: " + str(host) + ":" + str(port))

    while True:
        client_sockt, addr = server_socket.accept()
        exp = b''
        while True:
            data = client_sockt.recv(1024)
            exp += data
            if len(data) < 1024:
                break
        exp = exp.decode('utf-8')
        result = run_command(exp)
        client_sockt.sendall(result.encode('utf-8'))
        # print(str(addr))
        # print("Exp: " + str(exp))
        # print("Result: " + result)
        client_sockt.close()

def repl(prompt='>>> '):
    if len(sys.argv) >= 2:
        REP('(load-file "' + sys.argv[1] + '")')
        sys.exit(0)

    # repl loop
    REP("(println (str \"Mal [\" *host-language* \"]\"))")
    while True:
            line = mal_readline.readline(prompt)
            result = run_command(line)
            print(result)

def load_lib(file_path, package=None):
    if package:
        file_path ="."+ os.path.relpath(file_path, os.path.dirname(__file__))
        module_name = file_path.replace('\\', '.').replace('.py', '')
        module = importlib.import_module(package+module_name)
    else:
        module_name = file_path.replace('\\', '.').replace('.py', '')
        module = importlib.import_module(module_name)
    local = vars(module)
    local = {k.replace("_", "-") if not (k.startswith("__") and k.endswith("__")) else k: v for k, v in local.items()}
    for key, value in local.items():
        repl_env.set(types._symbol(key), value)

repl_env.set(types._symbol('send-msg'), send_msg)
repl_env.set(types._symbol('server'), server)
repl_env.set(types._symbol('repl'), repl)
repl_env.set(types._symbol('global-symbols-string'), lambda : list(repl_env.data.keys()))
repl_env.set(types._symbol('exit'), sys.exit)
repl_env.set(types._symbol('load-lib'), load_lib)

# repl()