from math import *
# from latexify import get_latex
import subprocess


def run_bash(command, wait=True):
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if wait:
        stdout, stderr = process.communicate()
        if not process.returncode:
            return stdout.decode()
        else:
            return stderr.decode()
    return process.returncode

def run_command(command, wait=True):
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if wait:
        stdout, stderr = process.communicate()
        return stdout.decode()
    return str(process.returncode)
