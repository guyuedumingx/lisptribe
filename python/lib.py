from math import *
from PIL import Image
import subprocess
import os
import shutil

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

def convert_to_png(jpgPath, pngPath=None):
    if not pngPath:
        pngPath = "".join([*jpgPath.split(".")[0:-1], ".png"])
    image = Image.open(jpgPath)
    image.save(pngPath)

def pic_to_pdf():
    desktop_path = os.path.expanduser("~/Desktop")
    new_folder = desktop_path + "/PDFs"
    if not os.path.exists(new_folder):
        os.makedirs(new_folder)
    for filename in os.listdir(desktop_path):
        if filename.endswith(".jpg") or filename.endswith(".png") or filename.endswith(".jpg"):
            img = Image.open(desktop_path + "/" + filename)
            pdf_filename = filename.split(".")[0]+".pdf"
            lst = img.split()
            print(lst)
            try:
                background = Image.new("RGB", img.size, (255,255,255))
                background.paste(img, mask=lst[3])
                background.save(new_folder + "/" + pdf_filename, "PDF", resolution=100.0, save_all=True)
            except:
                img.save(new_folder + "/" + pdf_filename, "PDF", resolution=100.0, save_all=True)

