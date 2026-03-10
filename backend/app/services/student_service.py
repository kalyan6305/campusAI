import pandas as pd
import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Path to the student data Excel file
# Preferring the KBH OVERALL DATA if it exists
EXCEL_PATH_KBH = os.path.join("data", "documents", "KBH-BLOCK  OVERALL DATA 2026 (1).xlsx")
EXCEL_PATH_DEFAULT = os.path.join("data", "documents", "students_data.xlsx")

# In-memory cache for student data
_cached_student_df: Optional[pd.DataFrame] = None

def load_student_data() -> Optional[pd.DataFrame]:
    """
    Loads the student data from Excel into a DataFrame.
    """
    global _cached_student_df
    
    if _cached_student_df is not None:
        return _cached_student_df

    target_path = EXCEL_PATH_KBH if os.path.exists(EXCEL_PATH_KBH) else EXCEL_PATH_DEFAULT

    if not os.path.exists(target_path):
        logger.error(f"Student data file not found at {target_path}")
        return None

    try:
        # Load Excel file
        df = pd.read_excel(target_path)
        
        # Normalize column names (lowercase and strip)
        df.columns = [str(col).lower().strip() for col in df.columns]
        
        # Mapping variations of common column names
        mapping = {
            'roll_number': ['roll number', 'roll no', 'roll_no', 'roll_number'],
            'name': ['name', 'student name', 'student_name'],
            'branch': ['branch'],
            'year': ['year'],
            'section': ['section'],
            'semester': ['semester'],
            'room_no': ['room no', 'room_no', 'room']
        }
        
        # Rename columns based on mapping
        for standard_name, aliases in mapping.items():
            for alias in aliases:
                if alias in df.columns and standard_name not in df.columns:
                    df.rename(columns={alias: standard_name}, inplace=True)
                    break

        if 'roll_number' not in df.columns:
            logger.error(f"Excel file at {target_path} does not contain a roll number column")
            return None
            
        # Normalize roll numbers (uppercase and strip)
        df['roll_number'] = df['roll_number'].astype(str).str.upper().str.strip()
        
        _cached_student_df = df
        logger.info(f"Student data loaded successfully from {target_path}")
        return _cached_student_df
    except Exception as e:
        logger.exception(f"Error loading student data: {str(e)}")
        return None

def get_student_by_roll(roll_number: str) -> Optional[Dict[str, Any]]:
    """
    Search student by roll number in the loaded Excel data.
    """
    df = load_student_data()
    if df is None:
        return None

    # Normalize search term
    search_roll = roll_number.upper().strip()
    
    # Search in dataframe
    match = df[df['roll_number'] == search_roll]
    
    if match.empty:
        return None
        
    # Convert row to dictionary
    student_info = match.iloc[0].to_dict()
    return student_info

# Optional: Initial load on module import
try:
    load_student_data()
except Exception:
    pass
