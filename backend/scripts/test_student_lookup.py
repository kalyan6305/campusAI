import requests
import time

def test_student_lookup():
    base_url = "http://localhost:8000/api/student"
    roll_number = "21KH1A05B6"
    
    print(f"Testing lookup for {roll_number}...")
    try:
        response = requests.get(f"{base_url}/{roll_number}")
        if response.status_code == 200:
            print("Success! Response:")
            print(response.json())
        else:
            print(f"Failed! Status code: {response.status_code}")
            print(response.text)
            
        print("\nTesting lookup for non-existent roll number...")
        response = requests.get(f"{base_url}/INVALID_ROLL")
        if response.status_code == 404:
            print("Successfully returned 404 for invalid roll number.")
        else:
            print(f"Unexpected status code for invalid roll: {response.status_code}")
            
    except Exception as e:
        print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    test_student_lookup()
