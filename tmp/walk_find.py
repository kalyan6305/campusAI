import os

def find_file(name, path):
    for root, dirs, files in os.walk(path):
        if name in files:
            return os.path.join(root, name)
    return None

def find_dir(name, path):
    for root, dirs, files in os.walk(path):
        if name in dirs:
            return os.path.join(root, name)
    return None

if __name__ == "__main__":
    base_path = r"d:\projects\campus_ai\backend"
    print(f"Searching in {base_path}...")
    
    agent_file = find_file("research_agent.py", base_path)
    print(f"Agent File: {agent_file}")
    
    agent_dir = find_dir("agents", base_path)
    print(f"Agent Dir: {agent_dir}")
    
    research_agent_service = find_file("research_agent_service.py", base_path)
    print(f"Research Agent Service: {research_agent_service}")
