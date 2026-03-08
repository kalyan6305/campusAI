import os

path = r"d:\projects\campus_ai\backend\app\agents\research_agent.py"
print(f"Checking {path}...")
print(f"Exists: {os.path.exists(path)}")

if not os.path.exists(path):
    print("Checking parent directory...")
    parent = os.path.dirname(path)
    print(f"Parent {parent} exists: {os.path.exists(parent)}")
    if os.path.exists(parent):
        print(f"Contents of {parent}:")
        print(os.listdir(parent))
    else:
        print("Checking grandparents...")
        grandparent = os.path.dirname(parent)
        print(f"Grandparent {grandparent} exists: {os.path.exists(grandparent)}")
        if os.path.exists(grandparent):
            print(f"Contents of {grandparent}:")
            print(os.listdir(grandparent))
