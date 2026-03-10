import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.services.student_service import get_student_by_roll

def test_logic():
    print("Testing student_service logic directly...")
    
    # Test valid roll number (from KBH file)
    roll = "226Q1A4229"
    print(f"Searching for {roll}...")
    student = get_student_by_roll(roll)
    if student:
        print(f"Success! Found: {student}")
    else:
        print("Failed to find valid student!")

    # Test case sensitivity
    roll_lower = "21kh1a05b6"
    print(f"Searching for {roll_lower} (case-insensitive test)...")
    student = get_student_by_roll(roll_lower)
    if student:
        print("Success! Case-insensitive search works.")
    else:
        print("Failed! Case-insensitive search failed.")

    # Test invalid roll
    roll_invalid = "INVALID_ROLL"
    print(f"Searching for {roll_invalid}...")
    student = get_student_by_roll(roll_invalid)
    if student is None:
        print("Success! Correctly returned None for invalid roll.")
    else:
        print(f"Failed! Returned something for invalid roll: {student}")

if __name__ == "__main__":
    test_logic()
