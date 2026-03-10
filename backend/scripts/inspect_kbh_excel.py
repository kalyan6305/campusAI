import pandas as pd
import os

file_path = os.path.join("data", "documents", "KBH-BLOCK  OVERALL DATA 2026 (1).xlsx")

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

try:
    df = pd.read_excel(file_path)
    print("Columns in KBH file:")
    print(df.columns.tolist())
    
    # Normalize roll number column and search
    # Find which column might be roll number
    roll_col = None
    for col in df.columns:
        if 'roll' in str(col).lower():
            roll_col = col
            break
    
    if roll_col:
        print(f"\nSearching for 226Q1A4229 in column: {roll_col}")
        # Search at Serial Number 137 (Index 136 or 135 depending on header)
        # S No 137 usually means index 136 if 0-indexed
        
        # Search by value
        match = df[df[roll_col].astype(str).str.upper().str.strip() == '226Q1A4229']
        if not match.empty:
            print("\nFound Student Details:")
            print(match.iloc[0].to_dict())
        else:
            print("\nRoll number 226Q1A4229 not found by value.")
            
        print("\nDetails at index 136 (Row 137/138):")
        if len(df) > 136:
             print(df.iloc[136].to_dict())
             
except Exception as e:
    print(f"Error reading file: {e}")
