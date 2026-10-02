const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const Scholarship = require('./models/Scholarship');
const SavedScholarship = require('./models/SavedScholarship');
const Document = require('./models/Document');
const Notification = require('./models/Notification');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholarease';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoUri}`);

    // Clear existing data
    await User.deleteMany({});
    await Scholarship.deleteMany({});
    await SavedScholarship.deleteMany({});
    await Document.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing collections...');

    // 1. Seed Admin User
    const admin = await Admin.create({
      name: 'Dr. Ramesh Kulkarni',
      email: 'admin@scholarease.gov.in',
      password: 'Password@123',
      phone: '+91 9876543210',
      role: 'Admin',
      adminId: 'ADM-2026',
    });

    console.log(`Created Admin: ${admin.email}`);

    // 2. Seed Student Users
    const student1 = await Student.create({
      name: 'Aarav Sharma',
      email: 'aarav@scholarease.edu',
      password: 'Password@123',
      phone: '+91 9823456789',
      role: 'Student',
      course: 'B.Tech Computer Science',
      year: 3,
      state: 'Maharashtra',
      income: 240000,
      category: 'General',
      cgpa: 8.7,
    });

    const student2 = await Student.create({
      name: 'Priya Patel',
      email: 'priya@scholarease.edu',
      password: 'Password@123',
      phone: '+91 9123456780',
      role: 'Student',
      course: 'B.Sc Physics',
      year: 2,
      state: 'Gujarat',
      income: 180000,
      category: 'OBC',
      cgpa: 9.2,
    });

    const student3 = await Student.create({
      name: 'Rahul Verma',
      email: 'rahul@scholarease.edu',
      password: 'Password@123',
      phone: '+91 9765432109',
      role: 'Student',
      course: 'B.E Mechanical Engineering',
      year: 4,
      state: 'Karnataka',
      income: 310000,
      category: 'SC',
      cgpa: 7.8,
    });

    console.log('Created 3 mock students.');

    // 3. Seed Scholarships
    const scholarships = await Scholarship.create([
      {
        scholarshipId: 'SCH-NMS-01',
        name: 'National Means-cum-Merit Scholarship Scheme (NMMSS)',
        provider: 'Ministry of Education, Govt. of India',
        description:
          'Awarded to meritorious students from economically weaker sections to arrest dropouts and encourage them to pursue higher secondary and tertiary education.',
        benefits: '₹12,000 to ₹50,000 per annum + Examination allowance',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days ahead
        applicationLink: 'https://scholarships.gov.in',
        status: 'Active',
        criteria: {
          course: ['All'],
          category: ['All'],
          state: 'All India',
          minimumIncome: 350000,
          minimumMarks: 7.0,
          otherRequirements: 'Regular student studying in Government/Recognized institutions.',
        },
      },
      {
        scholarshipId: 'SCH-PRAGATI-02',
        name: 'AICTE Pragati Scholarship for Girl Students',
        provider: 'All India Council for Technical Education (AICTE)',
        description:
          'Empowering women in STEM education by providing assistance for degree and diploma level technical courses.',
        benefits: '₹50,000 per year towards tuition fees, laptop, and stationary support',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        applicationLink: 'https://www.aicte-india.org',
        status: 'Active',
        criteria: {
          course: ['Engineering', 'B.Tech', 'B.E', 'Polytechnic'],
          category: ['All'],
          state: 'All India',
          minimumIncome: 800000,
          minimumMarks: 6.0,
          otherRequirements: 'Only girl students admitted to 1st year or 2nd year lateral entry.',
        },
      },
      {
        scholarshipId: 'SCH-PMM-03',
        name: 'Post-Matric Scholarship Scheme for Minorities',
        provider: 'Ministry of Minority Affairs',
        description:
          'Financial assistance to minority students pursuing technical, professional, or general undergraduate degrees.',
        benefits: '100% Admission & Tuition fee coverage + ₹1,000/month maintenance allowance',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationLink: 'https://scholarships.gov.in',
        status: 'Active',
        criteria: {
          course: ['All'],
          category: ['Minority', 'OBC', 'General'],
          state: 'All India',
          minimumIncome: 200000,
          minimumMarks: 5.5,
          otherRequirements: 'Must belong to notified minority communities (Muslims, Christians, Sikhs, Buddhists, Jains, Parsis).',
        },
      },
      {
        scholarshipId: 'SCH-TATA-04',
        name: 'Tata Trust Merit and Means Higher Education Grant',
        provider: 'Tata Community Initiatives Trust',
        description:
          'Prestigious philanthropic fellowship supporting deserving students across engineering, medical, and applied science disciplines.',
        benefits: 'Up to ₹85,000 towards institutional tuition and living allowances',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        applicationLink: 'https://tatatrusts.org/education',
        status: 'Active',
        criteria: {
          course: ['B.Tech', 'Engineering', 'Medical', 'B.Sc'],
          category: ['All'],
          state: 'Maharashtra',
          minimumIncome: 450000,
          minimumMarks: 8.0,
          otherRequirements: 'Academic excellence and verifiable genuine financial constraint.',
        },
      },
      {
        scholarshipId: 'SCH-ONGC-05',
        name: 'ONGC Foundation Scholarship for SC/ST/OBC Students',
        provider: 'Oil and Natural Gas Corporation (ONGC)',
        description:
          'Corporate Social Responsibility initiative extending holistic financial support to SC/ST/OBC engineering and geoscience scholars.',
        benefits: '₹48,000 per annum paid directly via DBT bank transfer',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        applicationLink: 'https://ongcindia.com/csr',
        status: 'Active',
        criteria: {
          course: ['Engineering', 'B.Tech', 'Geology', 'MBA'],
          category: ['SC', 'ST', 'OBC'],
          state: 'All India',
          minimumIncome: 450000,
          minimumMarks: 6.5,
          otherRequirements: 'Full-time regular degree enrolled student below 30 years.',
        },
      },
      {
        scholarshipId: 'SCH-CENTRAL-06',
        name: 'Central Sector Scheme of Scholarships for University Students',
        provider: 'Department of Higher Education, MHRD',
        description:
          'Merit-cum-means scholarship for top percentile board students pursuing higher education in recognized universities.',
        benefits: '₹12,000/year for first 3 years, ₹20,000/year at PG level',
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        applicationLink: 'https://scholarships.gov.in',
        status: 'Active',
        criteria: {
          course: ['All'],
          category: ['All'],
          state: 'All India',
          minimumIncome: 450000,
          minimumMarks: 8.0,
          otherRequirements: 'Top 20th percentile in Class 12 board examination.',
        },
      },
      {
        scholarshipId: 'SCH-INSPIRE-07',
        name: 'SHE - Scholarship for Higher Education (INSPIRE)',
        provider: 'Department of Science and Technology (DST)',
        description:
          'Flagship initiative targeting bright minds to undertake higher studies in Natural and Basic Sciences.',
        benefits: '₹80,000 per year (₹60,000 cash grant + ₹20,000 summer mentorship stipend)',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        applicationLink: 'https://online-inspire.gov.in',
        status: 'Upcoming',
        criteria: {
          course: ['B.Sc', 'Integrated M.Sc', 'Natural Sciences', 'Physics', 'Mathematics'],
          category: ['All'],
          state: 'All India',
          minimumIncome: 1000000,
          minimumMarks: 8.5,
          otherRequirements: 'Top 1% rank in Class 12 or KVPY/JEE/NEET rank holder.',
        },
      },
      {
        scholarshipId: 'SCH-MAHA-08',
        name: 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti',
        provider: 'Government of Maharashtra (MahaDBT)',
        description:
          'Tuition fee reimbursement scheme for economically backwards category students pursuing higher education.',
        benefits: '50% to 100% Tuition & Exam fee reimbursement',
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        applicationLink: 'https://mahadbt.maharashtra.gov.in',
        status: 'Active',
        criteria: {
          course: ['All'],
          category: ['General', 'EWS', 'OBC'],
          state: 'Maharashtra',
          minimumIncome: 800000,
          minimumMarks: 6.0,
          otherRequirements: 'Maharashtra state domicile certificate mandatory.',
        },
      },
    ]);

    console.log(`Created ${scholarships.length} scholarships.`);

    // 4. Seed Documents for Aarav
    const doc1 = await Document.create({
      student: student1._id,
      documentName: 'Income Certificate (FY 2025-26)',
      documentType: 'Income Certificate',
      filePath: '/uploads/sample_income_cert.pdf',
      status: 'Verified',
    });

    const doc2 = await Document.create({
      student: student1._id,
      documentName: 'Semester 5 Marksheet',
      documentType: 'Marksheet / Transcript',
      filePath: '/uploads/sample_marksheet.pdf',
      status: 'Verified',
    });

    const doc3 = await Document.create({
      student: student1._id,
      documentName: 'College Bonafide ID Card',
      documentType: 'College Bonafide / ID',
      filePath: '/uploads/sample_college_id.pdf',
      status: 'Verified',
    });

    student1.documents.push(doc1._id, doc2._id, doc3._id);

    // 5. Seed Saved Scholarships for Aarav
    const saved1 = await SavedScholarship.create({
      student: student1._id,
      scholarship: scholarships[0]._id, // NMMSS
    });
    const saved2 = await SavedScholarship.create({
      student: student1._id,
      scholarship: scholarships[3]._id, // Tata Trust
    });

    student1.savedScholarships.push(saved1._id, saved2._id);

    // 6. Seed Notifications for Aarav
    const notif1 = await Notification.create({
      userId: student1._id,
      message: 'Welcome to ScholarEase! Your student profile is verified and active.',
      type: 'System',
      isRead: true,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    const notif2 = await Notification.create({
      userId: student1._id,
      message: 'Your Income Certificate (FY 2025-26) was verified by administrative authorities.',
      type: 'Document',
      isRead: false,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    const notif3 = await Notification.create({
      userId: student1._id,
      message: 'Reminder: Deadline for National Means-cum-Merit Scholarship is approaching in 45 days.',
      type: 'Deadline',
      isRead: false,
      date: new Date(),
    });

    student1.notifications.push(notif1._id, notif2._id, notif3._id);
    await student1.save();

    console.log('Seeded documents, saved scholarships, and notifications for test student.');
    console.log('\n--- SEED SUMMARY ---');
    console.log('Admin Account:');
    console.log('  Email:    admin@scholarease.gov.in');
    console.log('  Password: Password@123');
    console.log('Student Account:');
    console.log('  Email:    aarav@scholarease.edu');
    console.log('  Password: Password@123');
    console.log('--------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedData();
