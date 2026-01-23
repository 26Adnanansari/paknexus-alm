# User Guide & Troubleshooting

## Accessing the Application
- **URL**: [https://paknexus-alm-saas.vercel.app/](https://paknexus-alm-saas.vercel.app/)
- **Login**: Click the "Login" button in the top right.
- **Credentials**: Use the credentials provided by your school administrator. 
  - *Demo credentials might be needed if you are testing.* 

## Dashboard Features

### 1. Students Directory
- **Navigate**: Click "Students" in the top navigation or sidebar.
- **Search**: Use the search bar to find students by Name or Admission Number.
- **Add Student**: 
  - Click the blue "+ Enroll Student" button.
  - Fill in the required fields (Name, Admission No, DOB).
  - *Note*: Ensure Admission Number is unique.
- **Troubleshooting "Failed to Add"**:
  - Check if the Admission Number already exists.
  - Ensure Date of Birth is valid.
  - If error persists, checking the browser console (F12) helps our team debug.

### 2. Teachers Management
- **Navigate**: Click "Teachers" in the top navigation.
- **Add Teacher**: 
  - Click "+ Add Teacher".
  - Required: Name, Employee ID, Join Date.
  - *Note*: Email must be unique if provided.
- **Troubleshooting**:
  - Duplicate Employee IDs or Emails are the most common cause of errors.

### 3. School Moments
- **Navigate**: Click "Moments" from the dashboard (if visible) or visit `/dashboard/moments`.
- **Viewing**: You can see highlights from the school.
- **Adding**: 
  - Click the **"Share Moment"** button in the header.
  - Upload up to **3 images or video clips**.
  - Add a catchy caption and click "Post Moment".
  - *Note: This feature is currently in "Simulation Mode". It demonstrates the UI flow but does not permanently save to the server yet.*

## Common Issues & Fixes

**"Profile icon is not active / Who is login?"**
- We have updated the navigation bar to explicitly show your **Name and Avatar** when you are logged in.
- If you still see the "Login" button, try refreshing the page or logging out and back in.

**"Failed to fetch branding / Red Errors"**
- You might see red errors in your browser console about "branding".
- **Status**: These are harmless warnings if you are on a test domain (`vercel.app`). The app functions normally using default "PakAi Nexus" branding.

**"Internal Server Error (500)"**
- This usually happens when adding data that conflicts with existing records (e.g., duplicate IDs).
- Try changing the unique IDs (Admission No, Employee ID) and try again.

---
*For further support, please contact the development team.*
