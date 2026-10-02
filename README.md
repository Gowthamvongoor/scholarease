# ScholarEase — Full-Stack MERN Scholarship Portal

ScholarEase is an end-to-end scholarship management and automated eligibility matching web application built using the **MERN** stack (MongoDB, Express.js, React.js, Node.js). It streamlines the scholarship discovery process for students and equips educational administrators with powerful tools to curate grants, verify student documents, and evaluate application metrics.

---

## 🚀 Key Features

### 🎓 Student Experience
- **Authentication**: JWT-secured registration and login with profile criteria (Course, Year, State, Income, Social Category, CGPA).
- **Automated Eligibility Engine**: Real-time evaluation of student profiles against scholarship criteria (Course, Category, State domicile, Family income threshold, Academic CGPA benchmarks) with interactive breakdown modals.
- **Scholarship Browser**: Search, filter by Social Category, State, Status, and 1-click "Show 100% Eligible Only" filter.
- **Bookmarks & Saved Vault**: Save/bookmark scholarships to track approaching deadlines.
- **Document Vault**: Upload, verify, preview, and manage academic documents (Income certificates, marksheets, caste certificates, IDs).
- **Notifications**: Real-time notification center tracking document verification, new scholarship alerts, and approaching deadlines.

### 🛡️ Administrator Console
- **Analytics & Metrics**: Real-time dashboard with metrics on registered students, total grants, active scholarships, vault documents, student category distributions, and popular bookmarks.
- **Scholarship CRUD**: Complete control to create, read, update, and delete scholarships with full criteria parameters.
- **User Directory**: Search and manage student and administrator accounts.

---

## 📂 Project Structure

```
scholarease/
├── scholarease/
│   ├── backend/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection logic
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification & role authorization
│   │   ├── models/
│   │   │   ├── User.js               # Base User schema with discriminator support
│   │   │   ├── Student.js            # Student schema extending User
│   │   │   ├── Admin.js              # Admin schema extending User
│   │   │   ├── Document.js           # Vault Document model
│   │   │   ├── Notification.js       # In-app notifications
│   │   │   ├── Scholarship.js        # Scholarship opportunity model & criteria
│   │   │   └── SavedScholarship.js   # Student bookmarks
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/v1/auth
│   │   │   ├── studentRoutes.js      # /api/v1/students
│   │   │   ├── adminRoutes.js        # /api/v1/admins
│   │   │   ├── scholarshipRoutes.js  # /api/v1/scholarships
│   │   │   └── notificationRoutes.js # /api/v1/notifications
│   │   ├── uploads/                  # Uploaded document vault files
│   │   ├── .env.example              # Sample environment configuration
│   │   ├── package.json              # Backend dependencies
│   │   ├── seed.js                   # Mock data seeding script
│   │   ├── server.js                 # Main Express server entry
│   │   └── test-api.js               # Automated API verification test suite
│   │
│   └── frontend/
│       ├── public/                   # Static public assets
│       ├── src/
│       │   ├── api/
│       │   │   └── axios.js          # Axios client with JWT interceptors
│       │   ├── components/
│       │   │   ├── Navbar.jsx        # Navigation bar & user badges
│       │   │   ├── NotificationsDropdown.jsx # Notification center
│       │   │   ├── ScholarshipCard.jsx       # Interactive scholarship card
│       │   │   └── EligibilityModal.jsx      # Criteria breakdown modal
│       │   ├── context/
│       │   │   └── AuthContext.jsx   # Global auth state & profile updates
│       │   ├── styles/
│       │   │   └── index.css         # Modern styling & design system
│       │   ├── views/
│       │   │   ├── Auth/
│       │   │   │   ├── Login.jsx     # Login with 1-click quick demo buttons
│       │   │   │   └── Register.jsx  # Student & Admin registration
│       │   │   ├── Student/
│       │   │   │   └── StudentDashboard.jsx # Student portal
│       │   │   └── Admin/
│       │   │       └── AdminDashboard.jsx   # Admin portal
│       │   ├── App.jsx               # Route definitions & protection
│       │   └── main.jsx              # React DOM mounting
│       ├── index.html                # App entry HTML
│       ├── package.json              # Frontend dependencies
│       └── vite.config.js            # Vite configuration with proxy
│
└── .gitignore                        # Git exclusion rules
```

---

## 🛠️ Prerequisites & Installation

### 1. Backend Setup
```bash
cd scholarease/backend
npm install
cp .env.example .env
```

Ensure MongoDB is running locally (`mongodb://localhost:27017/scholarease`) or specify your MongoDB connection string in `.env`.

### 2. Seed Mock Database
Populate realistic Indian scholarships, sample students, documents, bookmarks, and administrator credentials:
```bash
npm run seed
```

### 3. Run Backend Server
```bash
npm start
# Server starts at http://localhost:5000
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# Vite dev server runs at http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@scholarease.gov.in` | `Password@123` |
| **Student** | `aarav@scholarease.edu` | `Password@123` |
| **Student** | `priya@scholarease.edu` | `Password@123` |
| **Student** | `rahul@scholarease.edu` | `Password@123` |

*(Quick 1-Click login buttons are also provided directly on the Login page).*

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new Student or Admin | Public |
| `POST` | `/api/v1/auth/login` | Authenticate & obtain JWT | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Private |
| `PUT` | `/api/v1/students/profile` | Update student academic criteria | Student |
| `GET` | `/api/v1/students/eligibility` | Evaluate eligibility against grants | Student |
| `POST` | `/api/v1/students/upload-document` | Upload file to document vault | Student |
| `GET` | `/api/v1/students/documents` | List student documents | Student |
| `DELETE` | `/api/v1/students/documents/:id` | Remove document from vault | Student |
| `GET` | `/api/v1/scholarships` | Search & filter active grants | Public |
| `GET` | `/api/v1/scholarships/:id` | Get single grant details | Public |
| `POST` | `/api/v1/scholarships/:id/save` | Bookmark scholarship | Student |
| `DELETE`| `/api/v1/scholarships/:id/save` | Remove bookmark | Student |
| `GET` | `/api/v1/scholarships/saved/all` | Get all saved scholarships | Student |
| `GET` | `/api/v1/admins/metrics` | Retrieve system analytics | Admin |
| `GET` | `/api/v1/admins/users` | List and search all users | Admin |
| `DELETE`| `/api/v1/admins/users/:id` | Delete user and records | Admin |
| `POST` | `/api/v1/admins/scholarships` | Create new scholarship | Admin |
| `PUT` | `/api/v1/admins/scholarships/:id` | Update scholarship | Admin |
| `DELETE`| `/api/v1/admins/scholarships/:id` | Delete scholarship | Admin |
| `GET` | `/api/v1/notifications` | Fetch user notifications | Private |
| `PATCH`| `/api/v1/notifications/:id/read` | Mark notification read | Private |
| `PATCH`| `/api/v1/notifications/read-all` | Mark all read | Private |
