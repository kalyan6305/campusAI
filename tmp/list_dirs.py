import os

path = r"d:\projects\campus_ai\backend\app"
print(f"Listing all directories in {path}:")
for root, dirs, files in os.walk(path):
    print(f"{root}")
