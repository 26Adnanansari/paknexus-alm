import sys
import os

# Ensure we can import app
sys.path.append(os.getcwd())

from app.core.security import SecurityService

def main():
    password = "admin"
    print(f"Generating hash for password: '{password}' using app.core.security...")
    
    hashed = SecurityService.get_password_hash(password)
    print(f"HASH: {hashed}")
    
    print("Verifying hash immediately...")
    is_valid = SecurityService.verify_password(password, hashed)
    print(f"Verification Result: {is_valid}")

    if is_valid:
        print("SUCCESS: Hash is valid.")
    else:
        print("FAILURE: Hash verification failed context.")

if __name__ == "__main__":
    main()
