import asyncio
import httpx

async def repro():
    url = "http://localhost:8001/api/v1/auth/login/access-token"
    data = {
        "username": "pakaiverse@gmail.com",
        "password": "admin123"
    }
    
    async with httpx.AsyncClient() as client:
        # Login
        r = await client.post(url, data=data)
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text}")
            return
            
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create Tenant
        tenant_url = "http://localhost:8001/api/v1/admin/tenants?auto_create_db=true"
        tenant_data = {
            "name": "Verify School 5",
            "subdomain": "verify-school-5",
            "contact_email": "repro5@example.com",
            "contact_phone": "123456789",
            "supabase_url_raw": "shared_database",
            "supabase_key_raw": "shared"
        }
        
        print("Attempting to create tenant...")
        r = await client.post(tenant_url, json=tenant_data, headers=headers)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")

if __name__ == "__main__":
    asyncio.run(repro())
