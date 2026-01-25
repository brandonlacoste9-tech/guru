print("=== START ===")
print("Test starting...")

import sys
import os
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")

try:
    print("Loading dotenv...")
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="C:/Users/north/guru/.env")
    print("✅ dotenv loaded")
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL:
        print(f"✅ DATABASE_URL found: {DATABASE_URL[:50]}...")
    else:
        print("❌ DATABASE_URL not found")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("=== END ===")
