import sqlite3
import os

def migrate():
    # Path to your database
    db_path = "campus_ai.db"
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Migrating users table for UI and Language preferences...")
        
        # Add appearance
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN appearance TEXT DEFAULT 'system';")
            print("Added 'appearance' column.")
        except sqlite3.OperationalError as e:
            print(f"Column 'appearance' might already exist: {e}")

        # Add accent_color
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN accent_color TEXT DEFAULT 'blue';")
            print("Added 'accent_color' column.")
        except sqlite3.OperationalError as e:
            print(f"Column 'accent_color' might already exist: {e}")

        # Add language
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'english';")
            print("Added 'language' column.")
        except sqlite3.OperationalError as e:
            print(f"Column 'language' might already exist: {e}")

        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
