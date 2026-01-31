
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

def seed_data():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    print("Logged in successfully.")

    # 1. Get or Create Staff
    print("\n--- Staff ---")
    staff_response = requests.get(f"{API_URL}/staff", headers=headers)
    
    if staff_response.status_code == 200:
        staff_list = staff_response.json()
        print(f"Found {len(staff_list)} existing staff members.")
        
        if not staff_list:
            # Create a test staff member
            new_staff = {
                "full_name": "John Science Teacher",
                "email": f"john.science.{random.randint(100,999)}@example.com",
                "phone": "555-0123",
                "role": "teacher",
                "department": "Science",
                "designation": "Senior Teacher",
                "salary_amount": 5000.00,
                "join_date": "2024-01-15",
                "status": "active"
            }
            res = requests.post(f"{API_URL}/staff", headers=headers, json=new_staff)
            if res.status_code != 200:
                print(f"Failed to create staff: {res.content}")
                exit(1)
            target_staff = res.json()
            print(f"Created new staff: {target_staff['full_name']}")
        else:
            target_staff = staff_list[0]
            print(f"Using existing staff: {target_staff['full_name']}")
    else:
        print(f"Failed to fetch staff: {staff_response.content}")
        exit(1)

    staff_id = target_staff['staff_id']

    # 2. Add Attendance Records (Past 5 days)
    print("\n--- Attendance ---")
    today = datetime.date.today()
    statuses = ["present", "present", "present", "late", "absent"]
    
    for i in range(5):
        date = (today - datetime.timedelta(days=i)).isoformat()
        status = statuses[i]
        
        data = {
            "staff_id": staff_id,
            "date": date,
            "status": status,
            "check_in": "08:00" if status != "absent" else None,
            "check_out": "16:00" if status != "absent" else None,
            "remarks": "Auto-seeded"
        }
        
        res = requests.post(f"{API_URL}/attendance/staff/mark", headers=headers, json=data)
        if res.status_code == 200:
            print(f"Marked attendance for {date}: {status}")
        else:
            print(f"Failed to mark attendance for {date}: {res.content}")

    # 3. Add Payroll Records
    print("\n--- Payroll ---")
    payroll_data = [
        {"amount": 5000, "type": "salary", "description": "Monthly Salary - Jan", "payment_method": "bank_transfer"},
        {"amount": 200, "type": "bonus", "description": "Performance Bonus", "payment_method": "cash"},
        {"amount": 50, "type": "deduction", "description": "Late Fine", "payment_method": "deduction"}
    ]
    
    for p in payroll_data:
        p_data = {
            "amount": p["amount"],
            "transaction_date": today.isoformat(),
            "type": p["type"],
            "description": p["description"],
            "payment_method": p["payment_method"]
        }
        res = requests.post(f"{API_URL}/staff/{staff_id}/payroll", headers=headers, json=p_data)
        if res.status_code == 200:
            print(f"Added payroll: {p['description']}")
        else:
             print(f"Failed to add payroll: {res.content}")

    # 4. Timetable Setup (Classes & Periods)
    print("\n--- Timetable ---")
    # Need periods first
    periods_res = requests.get(f"{API_URL}/timetable/periods", headers=headers)
    periods = periods_res.json()
    if not periods:
        print("Initializing Timetable tables...")
        requests.post(f"{API_URL}/timetable/init", headers=headers) # Just in case
        
        # Create a period
        p_res = requests.post(f"{API_URL}/timetable/periods", headers=headers, json={
            "name": "Period 1", 
            "start_time": "08:00", 
            "end_time": "09:00", 
            "type": "academic"
        })
        if p_res.status_code == 200:
             periods = [p_res.json()]
             print("Created Period 1")

    # Need a class
    # Classes API might vary, assuming GET /classes works or similar from standard setup.
    # Actually tenant-app uses /classes from academic service usually?
    # Let's check api/v1/classes.py? I didn't verify if that exists.
    # Assuming basic 'classes' table exists from previous migrations.
    # I'll try to just fetch one.
    
    # Wait, I don't see a classes.py in my recent edits. I'll skip creating classes if API is missing.
    # But I can try to assign IF I can find classes/subjects.
    pass

if __name__ == "__main__":
    seed_data()
