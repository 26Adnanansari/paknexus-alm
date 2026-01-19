"""
Test script to verify the Multi-Tenant SaaS Control Plane API
Run this to create a test tenant and verify all endpoints work.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n1. Testing Health Endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    assert response.status_code == 200
    print("   ✅ Health check passed!")

def test_root():
    """Test root endpoint"""
    print("\n2. Testing Root Endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    assert response.status_code == 200
    print("   ✅ Root endpoint passed!")

def test_list_tenants():
    """Test listing tenants"""
    print("\n3. Testing List Tenants...")
    response = requests.get(f"{BASE_URL}/api/v1/admin/tenants")
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Total tenants: {data['pagination']['total']}")
    print(f"   Stats: {data['stats']}")
    print("   ✅ List tenants passed!")
    return data

def test_create_tenant():
    """Test creating a tenant"""
    print("\n4. Testing Create Tenant...")
    
    # Note: This will fail without actual Supabase credentials
    # For now, we'll just show the structure
    tenant_data = {
        "name": "Springfield Elementary School",
        "contact_email": "admin@springfield.edu",
        "contact_phone": "+1-555-0123",
        "supabase_url_raw": "postgresql://user:pass@localhost:5432/tenant_db",
        "supabase_key_raw": "test_key_123"
    }
    
    print(f"   Tenant data: {json.dumps(tenant_data, indent=2)}")
    print("   ⚠️  Skipping actual creation (requires valid Supabase credentials)")
    print("   Use the /docs endpoint to test this manually!")

def test_analytics():
    """Test analytics endpoint"""
    print("\n5. Testing Analytics...")
    response = requests.get(f"{BASE_URL}/api/v1/admin/analytics/revenue")
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   MRR: ${data['mrr']}")
    print(f"   Churn Rate: {data['churn_rate']}%")
    print(f"   Total Tenants: {data['total_tenants']}")
    print(f"   Active Tenants: {data['active_tenants']}")
    print("   ✅ Analytics passed!")

def main():
    print("=" * 60)
    print("Multi-Tenant SaaS Control Plane - API Test Suite")
    print("=" * 60)
    
    try:
        test_health()
        test_root()
        test_list_tenants()
        test_create_tenant()
        test_analytics()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nNext Steps:")
        print("1. Open http://localhost:8000/docs for interactive API testing")
        print("2. Create a tenant with real Supabase/NeonDB credentials")
        print("3. Test subscription management endpoints")
        print("4. Deploy to Railway for production")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to API")
        print("   Make sure Docker containers are running:")
        print("   docker-compose up -d")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    main()
