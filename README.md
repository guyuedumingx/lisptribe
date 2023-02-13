# Lisptribe  

这是一个基于开源项目[mal](https://github.com/kanaka/mal)实现的跨语言控制框架  

在`mal`不同平台解释器实现的基础上拓展解释器的功能， 增加`Socket`编程，网络通信，实现在多个语言解释器之间的`mal RPC`调用，通过`load-lib`函数将各平台语言的`native`函数暴露在`mal`解释器中，实现`mal`对原生语言的`RPC`调用  
```lisp
(def! python '(localhost 1235))
(use python (global-symbols))
```
表示调用运行在`localhost 1235`的python解释器并调用`global-symbols`函数  


## 安装  

1. 使用`git`将本项目克隆到本地  
```bash
git clone git@github.com:guyuedumingx/lisptribe.git
```

2. 运行想要运行的lisptribe客户端  
python  
```bash
cd python
python main.py
```

js  
```bash
cd js
node main.py
```

powershell  
```powershell
cd powershell
powershell main.py
```

3. 可选择性运行中心服务器  
```bash
cd CentralServer
python main.py
```


## 说明  

当客户端运行起来之后  
```bash
Mal [python]
>>>
```
其中 `[python]`表示当前的语言环境是`python`  
可使用`(global-symbols)`命令查看当前环境的所有指令
```bash
>>> (global-symbols)
(= throw nil? true? false? number? string? symbol symbol? keyword keyword? fn? macro? pr-str str prn println readline read-string slurp < <= > >= + - * / time-ms list list? vector vector? hash-map map? assoc dissoc get contains? keys vals sequential? cons concat vec nth first rest empty? count apply map conj seq with-meta meta atom atom? deref reset! swap! eval *ARGV* *host-language* not load-file cond send-msg server repl global-symbols-string exit load-lib type use use-to-mal pr-list dotimes bind-env new-env env-find env-find-str env-get env-set car cdr global remote global-symbols)
```
具体的关键字作用请查看[mal](https://github.com/kanaka/mal)语言解释器或参考lisp的其他实现  

使用`(load-file)`加载`mal`文件
```bash
>>> (load-file "init.mal")
nil
```

使用`(load-lib)`加载各具体平台的第三方依赖  

如python平台: 
```lisp
>>> (load-lib "env.py")
```
会自动加载`env.py`文件中的所有函数并映射到lisp中，可使用`(global-symbols)`指令查看

使用`use` `use-for-mal` `send-msg` 进行远程RPC调用  
> `use` `use-for-mal` 是在`init.mal`中实现的， `send-msg`是借助语言平台的socket编程实现的`native`函数  
```lisp
>>> (use '(localhost `1234) (sqrt 2))
```
上面的指令表示调用远程`(localhost 1234)`平台执行 `(sqrt 2)`指令  

使用`server`指令在本地运行服务器  
```lisp
(server "localhost" 1234)
```
表示在`loaclhost`的`1234`端口跑起一个服务器，可向其他`lisptribe解释器`提供RPC服务  

## 在项目中集成Lisptribe  

python 
1. 复制`python`文件夹下的`interpreter`文件夹到你的项目中  
2. 使用以下代码导入`lisptribe`  
python
```python
import sys
sys.path.append("./interpreter")

import interpreter.stepA_mal as interpreter
interpreter.REP("(load-file \"../init.mal\")") #加载init.mal文件
interpreter.repl()
```
`REP`函数表示解释字符串为`lisp`指令, `repl`函数在本地控制台打开`lisptribe` 的`repl`  

js
```js
var interpreter = require("./interpreter/stepA_mal");

interpreter.rep("(load-file \"../init.mal\")") //加载init.mal文件
interpreter.repl()
```

## 中心服务器(CentralServer)  
实现反向代理机制，用户在发送远程RPC请求时无需向具体的解释器发起调用，只需向中心服务器请求，由中心服务器分发RPC请求，经具体服务器执行后将结果返回给客户端  

1. 进入CentralServer文件夹  
```bash
cd CentralServer
```

2. 打开`CentralServer/init.mal`配置各服务器地址  
```lisp
(def! servers-map (hash-map
  'python '(localhost 1235)
  'js '(localhost 1236)
  'powershell '(localhost 1237)))
```
这段代码表示`python`服务器跑在`1235`端口...

3. 运行服务器  
```bash
python main.py
```

4. 在客户端请求中心服务器  
```lisp
;;假设中心服务器运行在 localhost 1234端口
(def! remote '(localhost 1234))
(use remote (powershell* "notepad"))
```
如果本地把`powershell`服务器跑起来了，那么上面的代码将会打开电脑的记事本  


## 相关项目  
[mal](https://github.com/kanaka/mal)  

## 贡献 
欢迎