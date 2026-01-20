import requests
import sys
import time

BASE_URL = "http://localhost:3000"

ROUTES = [
    {"path": "/", "status": 200, "name": "Landing Page"},
    {"path": "/login", "status": 200, "name": "Login Page"},
    {"path": "/dashboard", "status": 200, "name": "Dashboard (Protected)"}, # Might be 200 (if middleware redirects to login page content) or 307
    {"path": "/dashboard/karma", "status": 200, "name": "Karma Page"},
]

def verify_routes():
    print(f"Verifying routes on {BASE_URL}...")
    failed = False
    
    # Wait for server to be potentially ready if just started
    time.sleep(2)

    for route in ROUTES:
        url = f"{BASE_URL}{route['path']}"
        try:
            # Allow redirects=True to see where it lands, or False to check status
            # Next.js middleware often returns 307 for protect routes
            response = requests.get(url, allow_redirects=True, timeout=5)
            
            # If dashboard redirects to login (which gives 200), that is success
            if route['path'] == "/dashboard":
                if "/login" in response.url or response.status_code == 200:
                     print(f"[PASS] {route['name']}: {response.status_code} (URL: {response.url})")
                else:
                     print(f"[FAIL] {route['name']}: {response.status_code} (URL: {response.url})")
                     failed = True
            elif response.status_code == 200:
                print(f"[PASS] {route['name']}: {response.status_code}")
            else:
                print(f"[FAIL] {route['name']}: {response.status_code}")
                failed = True
                
        except Exception as e:
            print(f"[FAIL] {route['name']}: Exception {e}")
            failed = True

    if failed:
        sys.exit(1)
    else:
        print("\nAll critical routes verified successfully.")
        sys.exit(0)

if __name__ == "__main__":
    verify_routes()
