import requests
import sys

# Origins to verify
origins = [
    "https://paknexus-alm.vercel.app",
    "https://paknexus-alm-saas.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
]

url = "https://paknexus-alm.onrender.com/health"

print(f"Verifying CORS for URL: {url}\n")

all_passed = True

for origin in origins:
    try:
        # Preflight OPTIONS request
        response = requests.options(
            url,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET"
            }
        )
        
        acao = response.headers.get("Access-Control-Allow-Origin")
        status = response.status_code
        
        print(f"Origin: {origin}")
        print(f"  Status: {status}")
        print(f"  Access-Control-Allow-Origin: {acao}")
        
        # Check if successful (200 OK and correct header)
        if status == 200 and acao == origin:
            print("  [SUCCESS] CORS Allowed")
        elif status == 200 and acao == "*":
             print("  [SUCCESS] CORS Allowed (Wildcard)")
        else:
            print("  [FAILED] CORS Rejected or Misconfigured")
            all_passed = False
            
    except Exception as e:
        print(f"  [ERROR] Request failed: {e}")
        all_passed = False
    print("-" * 30)

if not all_passed:
    sys.exit(1)
