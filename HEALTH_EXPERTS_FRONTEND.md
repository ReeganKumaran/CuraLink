# Health Experts - Frontend Implementation

## 📱 New Pages Created

### 1. **Health Experts Page** (`/patient/health-experts`)
**File:** `src/pages/HealthExperts.jsx`

**Features:**
- ✅ Display all researchers with their profiles
- ✅ Search by name, institution, or specialty
- ✅ View researcher details (institution, specialties, research interests)
- ✅ Show active/inactive status
- ✅ Display publications count
- ✅ Links to ORCID and ResearchGate
- ✅ Request meeting modal
- ✅ Email researcher directly

**Screenshots:**
- Grid view of all researchers
- Search bar for filtering
- Specialty tags
- Active status badge
- Request meeting button

---

### 2. **Researcher Meeting Requests Page** (`/researcher/meeting-requests`)
**File:** `src/pages/ResearcherMeetingRequests.jsx`

**Features:**
- ✅ View all meeting requests from patients
- ✅ Filter by status (All, Pending, Accepted, Completed)
- ✅ Full patient details:
  - Patient name
  - Patient email
  - Patient contact
  - Patient notes/message
- ✅ Accept/Reject requests
- ✅ Mark as completed
- ✅ Email patient directly
- ✅ Request counts by status

---

## 🔧 New Service Created

### **Health Experts Service**
**File:** `src/services/healthExpertsService.js`

**Methods:**
```javascript
// For Patients
getHealthExperts()              // Get all researchers
requestMeeting(requestData)     // Request meeting with researcher
getMyMeetingRequests()          // Get patient's meeting requests

// For Researchers
getResearcherMeetingRequests()  // Get researcher's meeting requests
updateMeetingRequestStatus()    // Update request status
```

---

## 🛣️ New Routes Added

**In `App.jsx`:**
```javascript
// Patient Routes
<Route path="/patient/health-experts" element={<HealthExperts />} />

// Researcher Routes
<Route path="/researcher/meeting-requests" element={<ResearcherMeetingRequests />} />
```

---

## 🎨 UI Components

### Health Experts Card
- Researcher avatar placeholder
- Name and institution
- Active status badge
- Specialty tags (showing first 3 + count)
- Research interests excerpt
- Publications count
- External links (ORCID, ResearchGate)
- Request Meeting & Email buttons

### Meeting Request Modal
- Researcher name display
- Contact information input (required)
- Message/Notes textarea
- Warning for inactive researchers
- Send/Cancel buttons
- Success/Error messages

### Meeting Request Card
- Patient avatar
- Patient name and contact info
- Request date/time
- Status badge
- Patient's message/notes
- Action buttons (Accept/Reject/Complete)

---

## 🔄 User Flows

### **Patient Flow:**
1. Login as patient
2. Navigate to "Health Experts" page
3. Browse/Search researchers
4. Click "Request Meeting" on desired researcher
5. Fill in contact info and optional message
6. Submit request
7. See success message

### **Researcher Flow:**
1. Login as researcher
2. Navigate to "Meeting Requests" page
3. View list of requests with full patient details
4. Filter by status (Pending, Accepted, etc.)
5. Click "Accept" or "Reject"
6. For accepted requests, can mark as "Completed"
7. Email patient directly from the interface

---

## 🎯 Key Features

### ✅ **Search & Filter**
- Real-time search by name, institution, or specialty
- Filter meeting requests by status

### ✅ **Status Management**
- Pending → Accepted → Completed
- Pending → Rejected
- Visual status badges with colors

### ✅ **Patient Information**
Researchers see:
- Full patient name
- Patient email
- Patient contact (phone/email)
- Patient's message/notes about their condition

### ✅ **Active/Inactive Handling**
- Active researchers: Request goes to "pending"
- Inactive researchers: Request marked as "awaiting_researcher_join" with notification

### ✅ **Direct Communication**
- Email links for direct contact
- Meeting request notes for context

---

## 📊 Status Flow Diagram

```
Patient Requests Meeting
         ↓
    [Researcher Active?]
         ↓
    Yes → PENDING
         ↓
    [Researcher Action]
         ↓
    ├→ ACCEPTED → COMPLETED
    └→ REJECTED

    No → AWAITING_RESEARCHER_JOIN
```

---

## 🚀 How to Use

### **As a Patient:**
1. Go to `/patient/health-experts`
2. Search for researchers by specialty or name
3. Click "Request Meeting"
4. Provide your contact info and message
5. Submit request

### **As a Researcher:**
1. Go to `/researcher/meeting-requests`
2. View all meeting requests
3. Read patient details and notes
4. Accept or reject requests
5. Mark completed meetings

---

## 🎨 Styling Notes

- Uses Tailwind CSS utility classes
- Responsive grid layout (1-3 columns)
- Hover effects on cards
- Color-coded status badges:
  - Yellow: Pending
  - Green: Accepted
  - Red: Rejected
  - Blue: Completed
- Lucide React icons throughout

---

## 🔐 Authentication

Both pages require authentication:
- Health Experts: Requires patient token
- Meeting Requests: Requires researcher token

Token is automatically included via axios interceptor (from authService)

---

## 📝 TODO (Future Enhancements)

- [ ] Add pagination for large lists
- [ ] Add email notifications
- [ ] Add calendar integration
- [ ] Add video meeting links (Zoom, Google Meet)
- [ ] Add researcher ratings/reviews
- [ ] Add advanced filters (location, years of experience)
- [ ] Add researcher availability calendar
- [ ] Add meeting history/notes

---

## 🐛 Error Handling

Both pages include:
- Loading states (spinner)
- Error messages (red alert boxes)
- Success messages (green alert boxes)
- Empty states ("No results found")
- Form validation

---

## 📱 Responsive Design

- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 columns
- Modal: Centered overlay on all screen sizes

---

## 🔗 Integration Points

**Frontend:**
- `authService.js` - Token management
- `healthExpertsService.js` - API calls

**Backend:**
- `/api/v1/patients/health-experts` - GET
- `/api/v1/patients/meeting-requests` - POST, GET
- `/api/v1/researchers/meeting-requests` - GET
- `/api/v1/researchers/meeting-requests/:id` - PUT

---

## ✨ Success!

The Health Experts feature is now fully implemented on the frontend! 🎉

Patients can browse and request meetings with researchers.
Researchers can view and manage meeting requests with full patient details.
