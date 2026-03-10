import pandas as pd
import os

data = {
    "roll_number": ["21KH1A05B6", "21KH1A05B7", "21KH1A05B8", "226Q1A4229"],
    "name": ["Ravi Kumar", "Sita Devi", "Arjun Singh", "Vamsi Krishna"],
    "branch": ["CSE", "ECE", "EEE", "CSE"],
    "year": ["3", "2", "4", "3"],
    "semester": ["2", "1", "2", "1"],
    "section": ["A", "B", "C", "B"]
}

df = pd.DataFrame(data)
os.makedirs("data/documents", exist_ok=True)
df.to_excel("data/documents/students_data.xlsx", index=False)
print("Dummy students_data.xlsx created successfully.")
