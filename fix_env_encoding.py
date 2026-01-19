import os

def fix_env():
    env_path = ".env"
    with open(env_path, "rb") as f:
        content = f.read()
    
    # Check for UTF-16 BOM or null bytes
    if b"\x00" in content:
        print("Detected null bytes (likely UTF-16). Converting to UTF-8...")
        # Try to decode as UTF-16
        try:
            text = content.decode("utf-16")
        except:
            text = content.replace(b"\x00", b"").decode("utf-8")
    else:
        text = content.decode("utf-8")
    
    # Clean up and ensure UTF-8
    lines = text.splitlines()
    clean_lines = [line.strip() for line in lines if line.strip() and "=" in line]
    
    # Write back as clean UTF-8
    with open(env_path, "w", encoding="utf-8") as f:
        f.write("\n".join(clean_lines) + "\n")
    
    print("Fixed .env encoding.")

if __name__ == "__main__":
    fix_env()
