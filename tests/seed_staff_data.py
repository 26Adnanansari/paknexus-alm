
import requests
import datetime
import random
import uuid

# Configuration
API_URL = "https://paknexus-alm.onrender.com/api/v1"
EMAIL = "bestacademy@gmail.com"
PASSWORD = "bestacademy"

import time

def get_token():
    retries = 5
    for i in range(retries):
        try:
            print(f"Attempting login ({i+1}/{retries})...")
            response = requests.post(f"{API_URL}/auth/login/access-token", data={
                "username": EMAIL,
                "password": PASSWORD
            })
            response.raise_for_status()
            return response.json()['access_token']
        except requests.exceptions.ConnectionError:
            print("Server not ready, waiting...")
            time.sleep(2)
        except Exception as e:
            print(f"Login failed: {e}")
            if 'response' in locals() and response.content:
                print(f"Response: {response.content}")
            exit(1)
    print("Could not connect to server after multiple retries.")
    exit(1)

def verify_payroll_fix():
    print("--- Verifying Payroll Fix on Live Server ---")
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    # 1. Get a Staff Member
    print("Fetching staff list...")
    staff_response = requests.get(f"{API_URL}/staff", headers=headers)
    if staff_response.status_code != 200:
        print(f"Failed to fetch staff: {staff_response.content}")
        exit(1)
    
    staff_list = staff_response.json()
    if not staff_list:
        print("No staff found. Creating one...")
        # Create dummy if needed (unlikely based on previous run)
        new_staff = {
            "full_name": "Payroll Tester",
            "email": f"payroll.test.{random.randint(1000,9999)}@example.com",
            "phone": "555-9999",
            "role": "teacher",
            "salary_amount": 5000.00,
            "join_date": "2024-01-01",
            "status": "active"
        }
        res = requests.post(f"{API_URL}/staff", headers=headers, json=new_staff)
        res.raise_for_status()
        target_staff = res.json()
    else:
        # Use the "Ms. Zainab" or whoever is first
        target_staff = staff_list[0] 
        print(f"Testing with staff: {target_staff['full_name']} ({target_staff['staff_id']})")
    
    staff_id = target_staff['staff_id']

    # 2. Attempt Payroll Transaction
    print("\nAttempting to record payment...")
    transaction_data = {
        "amount": 1234.56,
        "transaction_date": datetime.date.today().isoformat(),
        "type": "salary",
        "description": "Verification Test Payment",
        "payment_method": "bank_transfer"
    }

    try:
        res = requests.post(f"{API_URL}/staff/{staff_id}/payroll", headers=headers, json=transaction_data)
        
        if res.status_code == 200:
            print("\n✅ SUCCESS! Payroll transaction recorded.")
            print(f"Response: {res.json()}")
            print("The 'relation does not exist' error is resolved.")
        else:
            print(f"\n❌ FAILED. Status: {res.status_code}")
            print(f"Response: {res.content}")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")

if __name__ == "__main__":
    verify_payroll_fix()
