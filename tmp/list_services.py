import os

path = r"d:\projects\campus_ai\backend\app\services"
print(f"Listing all files in {path}:")
try:
    files = os.listdir(path)
    for f in files:
        full_path = os.path.join(path, f)
        is_dir = os.path.isdir(full_path)
        print(f"{'[DIR]' if is_dir else '[FILE]'} {f}")
except Exception as e:
    print(f"Error: {e}")
