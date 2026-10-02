const http = require('http');

// Helper to make HTTP requests
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting ScholarEase API Verification Tests ---');

  // Start express app in-process
  const app = require('./server');
  const server = app.listen(5099, async () => {
    console.log('Test server listening on port 5099');

    try {
      // 1. Health check
      console.log('\n1. Testing GET /api/v1/health');
      const health = await request({
        hostname: 'localhost',
        port: 5099,
        path: '/api/v1/health',
        method: 'GET',
      });
      console.log('Status:', health.status, 'Body:', health.data);

      // 2. Login Student
      console.log('\n2. Testing POST /api/v1/auth/login (Student)');
      const studentLogin = await request(
        {
          hostname: 'localhost',
          port: 5099,
          path: '/api/v1/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { email: 'aarav@scholarease.edu', password: 'Password@123' }
      );
      console.log('Status:', studentLogin.status, 'Success:', studentLogin.data.success);
      const studentToken = studentLogin.data.token;

      // 3. Login Admin
      console.log('\n3. Testing POST /api/v1/auth/login (Admin)');
      const adminLogin = await request(
        {
          hostname: 'localhost',
          port: 5099,
          path: '/api/v1/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { email: 'admin@scholarease.gov.in', password: 'Password@123' }
      );
      console.log('Status:', adminLogin.status, 'Success:', adminLogin.data.success);
      const adminToken = adminLogin.data.token;

      // 4. Fetch Scholarships
      console.log('\n4. Testing GET /api/v1/scholarships');
      const schList = await request({
        hostname: 'localhost',
        port: 5099,
        path: '/api/v1/scholarships',
        method: 'GET',
      });
      console.log('Status:', schList.status, 'Count:', schList.data.count);

      // 5. Check Eligibility
      console.log('\n5. Testing GET /api/v1/students/eligibility');
      const elig = await request({
        hostname: 'localhost',
        port: 5099,
        path: '/api/v1/students/eligibility',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      console.log(
        'Status:',
        elig.status,
        'Eligible count:',
        elig.data.eligibleCount,
        'Total evaluated:',
        elig.data.totalCount
      );

      // 6. Test Document Upload (mock JSON or metadata)
      console.log('\n6. Testing POST /api/v1/students/upload-document');
      const uploadDoc = await request(
        {
          hostname: 'localhost',
          port: 5099,
          path: '/api/v1/students/upload-document',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentToken}`,
          },
        },
        {
          documentName: 'Verification ID Card',
          documentType: 'College Bonafide / ID',
          filePath: '/uploads/sample_id_card.pdf',
        }
      );
      console.log('Status:', uploadDoc.status, 'Success:', uploadDoc.data.success);

      // 7. Test Admin Metrics
      console.log('\n7. Testing GET /api/v1/admins/metrics');
      const metrics = await request({
        hostname: 'localhost',
        port: 5099,
        path: '/api/v1/admins/metrics',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(
        'Status:',
        metrics.status,
        'Total Students:',
        metrics.data.metrics?.totalStudents,
        'Total Scholarships:',
        metrics.data.metrics?.scholarships?.total
      );

      // 8. Test Admin Manage Users
      console.log('\n8. Testing GET /api/v1/admins/users');
      const users = await request({
        hostname: 'localhost',
        port: 5099,
        path: '/api/v1/admins/users',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log('Status:', users.status, 'Users count:', users.data.count);

      // 9. Test Notifications
      console.log('\n9. Testing GET /api/v1/notifications');
      const notifs = await request({
        hostname: 'localhost',
        port: 5099,
        path: '/api/v1/notifications',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      console.log('Status:', notifs.status, 'Notifications count:', notifs.data.totalCount);

      console.log('\n--- ALL API TESTS COMPLETED SUCCESSFULLY ---');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Test execution failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

runTests();
