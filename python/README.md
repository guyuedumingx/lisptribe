使用python的(load-lib)时
相对路径的根目录是执行文件的位置

比如
```bash
python main.py
```
那么在根`main.py`所在文件夹就是根

```lisp
(load-lib "lib.py")
```