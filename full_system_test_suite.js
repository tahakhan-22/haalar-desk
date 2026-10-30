const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const { headers = {}, ...restOptions } = options;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  const tests = [];

  function record(id, module, feature, role, expected, actual, status, severity, notes) {
    tests.push({ id, module, feature, role, expected, actual, status, severity, notes });
    console.log(`[${status}] ${id} | ${module} | ${feature} (${role}) -> ${notes || ''}`);
  }

  console.log('========================================================');
  console.log('  HAALAR DESK - PHASE 1 CRITICAL SECURITY REMEDIATION');
  console.log('  AUTOMATED REGRESSION & PERMISSION VERIFICATION');
  console.log('========================================================\n');

  // 1. HEALTH CHECKS
  const healthRoot = await request({ path: '/', method: 'GET' });
  record('HLTH-001', 'Core', 'System Root Health Check', 'Anonymous', 200, healthRoot.statusCode, healthRoot.statusCode === 200 ? 'PASS' : 'FAIL', 'Medium', healthRoot.data?.version);

  const healthApi = await request({ path: '/api/health', method: 'GET' });
  record('HLTH-002', 'Core', 'API Health Check', 'Anonymous', 200, healthApi.statusCode, healthApi.statusCode === 200 ? 'PASS' : 'FAIL', 'Medium', healthApi.data?.status);

  // 2. AUTHENTICATION & LOGIN FOR ALL 4 PERSONAS
  const personas = [
    { username: 'ceo', role: 'CEO', clearance: 4 },
    { username: 'usman', role: 'Supervisor', clearance: 3 },
    { username: 'bilal', role: 'Logistics Admin', clearance: 2 },
    { username: 'zainab', role: 'Employee', clearance: 2 },
    { username: 'taha', role: 'Employee', clearance: 2 }
  ];

  const tokens = {};

  for (const p of personas) {
    const res = await request({ path: '/api/auth/login', method: 'POST' }, { username: p.username, password: 'Haalar@2026!' });
    const passed = res.statusCode === 200 && res.data?.token && res.data?.user?.securityClearance === p.clearance;
    if (passed) tokens[p.username] = res.data.token;
    record(`AUTH-${p.username.toUpperCase()}`, 'Auth', `Login Persona: ${p.role} (${p.username})`, p.role, 200, res.statusCode, passed ? 'PASS' : 'FAIL', 'Critical', `Clearance: ${res.data?.user?.securityClearance}`);
  }

  // =========================================================================
  // REMEDIATION VERIFICATION: BUG-SEC-01 (EMPLOYEE SENSITIVE FIELD PROTECTION)
  // =========================================================================
  console.log('\n--- VERIFYING BUG-SEC-01: SENSITIVE EMPLOYEE FIELD REDACTION ---');

  // CEO can view full employee dossier including salary & CNIC
  const ceoViewCEO = await request({ path: '/api/doctype/tab_employee/HR-EMP-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['ceo']}` } });
  const ceoHasSalary = ceoViewCEO.data?.doc?.salary_pkr !== undefined;
  const ceoHasCNIC = ceoViewCEO.data?.doc?.cnic !== undefined;
  record('SEC-01-A', 'HR/Security', 'CEO Can View Employee Salary & CNIC', 'CEO', true, ceoHasSalary && ceoHasCNIC, ceoHasSalary && ceoHasCNIC ? 'PASS' : 'FAIL', 'Critical', `Salary: Rs. ${ceoViewCEO.data?.doc?.salary_pkr}`);

  // General Employee viewing CEO record: salary_pkr and cnic MUST be redacted
  const empViewCEO = await request({ path: '/api/doctype/tab_employee/HR-EMP-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  const empSalaryExposed = empViewCEO.data?.doc?.salary_pkr !== undefined;
  const empCNICExposed = empViewCEO.data?.doc?.cnic !== undefined;
  record('SEC-01-B', 'HR/Security', 'Employee Direct IDOR Salary Redacted', 'Employee', false, empSalaryExposed, !empSalaryExposed ? 'PASS' : 'FAIL', 'Critical', empSalaryExposed ? 'LEAKED' : 'Properly Redacted (undefined)');
  record('SEC-01-C', 'HR/Security', 'Employee Direct IDOR CNIC Redacted', 'Employee', false, empCNICExposed, !empCNICExposed ? 'PASS' : 'FAIL', 'Critical', empCNICExposed ? 'LEAKED' : 'Properly Redacted (undefined)');

  // Supervisor viewing employee record: salary_pkr and cnic MUST be redacted
  const supViewCEO = await request({ path: '/api/doctype/tab_employee/HR-EMP-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['usman']}` } });
  const supSalaryExposed = supViewCEO.data?.doc?.salary_pkr !== undefined;
  const supCNICExposed = supViewCEO.data?.doc?.cnic !== undefined;
  record('SEC-01-D', 'HR/Security', 'Supervisor Direct IDOR Salary Redacted', 'Supervisor', false, supSalaryExposed, !supSalaryExposed ? 'PASS' : 'FAIL', 'Critical', supSalaryExposed ? 'LEAKED' : 'Properly Redacted (undefined)');

  // =========================================================================
  // REMEDIATION VERIFICATION: BUG-SEC-02 (UNAUTHORIZED EMPLOYEE CREATION)
  // =========================================================================
  console.log('\n--- VERIFYING BUG-SEC-02: EMPLOYEE CREATION RESTRICTION ---');

  // General Employee attempting to create an employee record
  const empCreateEmp = await request({
    path: '/api/doctype/tab_employee',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  }, {
    employee_name: 'Attacker Impersonation',
    designation: 'Fake Specialist',
    salary_pkr: 999999
  });
  record('SEC-02-A', 'HR/Security', 'Block Employee from Creating Employee Record', 'Employee', 403, empCreateEmp.statusCode, empCreateEmp.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empCreateEmp.data?.message);

  // Supervisor attempting to create an employee record
  const supCreateEmp = await request({
    path: '/api/doctype/tab_employee',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['usman']}` }
  }, {
    employee_name: 'Supervisor Unauthorized Hire',
    designation: 'Junior Engineer'
  });
  record('SEC-02-B', 'HR/Security', 'Block Supervisor from Creating Employee Record', 'Supervisor', 403, supCreateEmp.statusCode, supCreateEmp.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', supCreateEmp.data?.message);

  // Logistics Admin attempting to create an employee record
  const logCreateEmp = await request({
    path: '/api/doctype/tab_employee',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['bilal']}` }
  }, {
    employee_name: 'Logistics Unauthorized Hire'
  });
  record('SEC-02-C', 'HR/Security', 'Block Logistics Admin from Creating Employee Record', 'Logistics Admin', 403, logCreateEmp.statusCode, logCreateEmp.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', logCreateEmp.data?.message);

  // Authorized CEO creates an employee record
  const ceoCreateEmp = await request({
    path: '/api/doctype/tab_employee',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['ceo']}` }
  }, {
    employee_name: 'Dr. Tariq Jamil (Authorized Research Scientist)',
    designation: 'Principal RF Physicist',
    department: 'Hardware & RF Engineering',
    salary_pkr: 380000,
    cnic: '61101-9988776-5'
  });
  record('SEC-02-D', 'HR/Security', 'CEO Authorized Employee Creation', 'CEO', 201, ceoCreateEmp.statusCode, ceoCreateEmp.statusCode === 201 ? 'PASS' : 'FAIL', 'Critical', `Created: ${ceoCreateEmp.data?.doc?.name}`);

  // =========================================================================
  // REMEDIATION VERIFICATION: BUG-SEC-03 (UNAUTHORIZED SALARY & FIELD MODIFICATION)
  // =========================================================================
  console.log('\n--- VERIFYING BUG-SEC-03: RESTRICTED FIELD & SALARY PATCHING ---');

  // Employee attempting to elevate own salary via PATCH
  const empPatchSalary = await request({
    path: '/api/doctype/tab_employee/HR-EMP-0004',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  }, {
    salary_pkr: 888888
  });
  record('SEC-03-A', 'HR/Security', 'Block Employee from Modifying Own Salary via PATCH', 'Employee', 403, empPatchSalary.statusCode, empPatchSalary.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empPatchSalary.data?.message);

  // Employee attempting to modify CNIC via PATCH
  const empPatchCNIC = await request({
    path: '/api/doctype/tab_employee/HR-EMP-0004',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  }, {
    cnic: '61101-0000000-0'
  });
  record('SEC-03-B', 'HR/Security', 'Block Employee from Modifying CNIC via PATCH', 'Employee', 403, empPatchCNIC.statusCode, empPatchCNIC.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empPatchCNIC.data?.message);

  // Supervisor attempting to modify salary
  const supPatchSalary = await request({
    path: '/api/doctype/tab_employee/HR-EMP-0004',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens['usman']}` }
  }, {
    salary_pkr: 450000
  });
  record('SEC-03-C', 'HR/Security', 'Block Supervisor from Modifying Employee Salary', 'Supervisor', 403, supPatchSalary.statusCode, supPatchSalary.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', supPatchSalary.data?.message);

  // Employee attempting to edit another employee's record
  const empEditOther = await request({
    path: '/api/doctype/tab_employee/HR-EMP-0001',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  }, {
    cell_number: '+92-333-0000000'
  });
  record('SEC-03-D', 'HR/Security', 'Block Employee from Modifying Other Employee Profile', 'Employee', 403, empEditOther.statusCode, empEditOther.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empEditOther.data?.message);

  // CEO Authorized salary adjustment
  const ceoPatchSalary = await request({
    path: '/api/doctype/tab_employee/HR-EMP-0004',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens['ceo']}` }
  }, {
    salary_pkr: 295000
  });
  record('SEC-03-E', 'HR/Security', 'CEO Authorized Salary Adjustment', 'CEO', 200, ceoPatchSalary.statusCode, ceoPatchSalary.statusCode === 200 ? 'PASS' : 'FAIL', 'Critical', `Updated Salary: Rs. ${ceoPatchSalary.data?.doc?.salary_pkr}`);

  // =========================================================================
  // REMEDIATION VERIFICATION: BUG-SEC-04 (ASSET REQUEST SELF-APPROVAL)
  // =========================================================================
  console.log('\n--- VERIFYING BUG-SEC-04: EQUIPMENT APPROVALS & SELF-APPROVAL LOCK ---');

  // Ensure ASSET-0003 is returned to store and Available
  await request({ path: '/api/doctype/tab_asset/ASSET-0003/return', method: 'POST', headers: { Authorization: `Bearer ${tokens['bilal']}` } });

  // 1. Employee Zainab applies for equipment ASSET-0003
  const createAssetReq = await request({
    path: '/api/doctype/tab_asset_request',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  }, {
    asset: 'ASSET-0003',
    asset_name: 'Keysight InfiniiVision 4-Channel 500MHz Digital Oscilloscope',
    purpose: 'CAN-Bus hardware latency profiling',
    start_date: '2026-10-31',
    return_date: '2026-11-04'
  });
  const newReqName = createAssetReq.data?.doc?.name;
  record('SEC-04-A', 'Asset/Security', 'Employee Submits Valid Asset Request', 'Employee', 201, createAssetReq.statusCode, createAssetReq.statusCode === 201 ? 'PASS' : 'FAIL', 'High', `Request ID: ${newReqName}`);

  // 2. Employee Zainab attempts to SELF-APPROVE her own request
  const empSelfApprove = await request({
    path: `/api/doctype/tab_asset_request/${newReqName}/approve`,
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  });
  record('SEC-04-B', 'Asset/Security', 'Reject Employee Equipment Approval (Clearance Check)', 'Employee', 403, empSelfApprove.statusCode, empSelfApprove.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empSelfApprove.data?.message);

  // 3. Logistics Admin attempts to approve equipment checkout
  const logApprove = await request({
    path: `/api/doctype/tab_asset_request/${newReqName}/approve`,
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['bilal']}` }
  });
  record('SEC-04-C', 'Asset/Security', 'Reject Logistics Admin Approval (Requires Sup/CEO)', 'Logistics Admin', 403, logApprove.statusCode, logApprove.statusCode === 403 ? 'PASS' : 'FAIL', 'High', logApprove.data?.message);

  // 4. Supervisor Usman (Authorized) approves Zainab's request
  const supApprove = await request({
    path: `/api/doctype/tab_asset_request/${newReqName}/approve`,
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['usman']}` }
  });
  record('SEC-04-D', 'Asset/Security', 'Supervisor Authorized Asset Approval', 'Supervisor', 200, supApprove.statusCode, supApprove.statusCode === 200 ? 'PASS' : 'FAIL', 'High', supApprove.data?.message);

  // 5. Verify asset is now In-Use and prevents double-booking
  const supDoubleApprove = await request({
    path: `/api/doctype/tab_asset_request/${newReqName}/approve`,
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['usman']}` }
  });
  record('SEC-04-E', 'Asset/Security', 'Prevent Double-Booking on In-Use Equipment', 'Supervisor', 400, supDoubleApprove.statusCode, supDoubleApprove.statusCode === 400 ? 'PASS' : 'FAIL', 'Critical', supDoubleApprove.data?.message);

  // 6. Supervisor attempting to self-approve his own request
  const supOwnReq = await request({
    path: '/api/doctype/tab_asset_request',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['usman']}` }
  }, {
    asset: 'ASSET-0003',
    asset_name: 'Keysight InfiniiVision',
    purpose: 'Personal bench review'
  });
  const supOwnReqId = supOwnReq.data?.doc?.name;
  const supSelfApprove = await request({
    path: `/api/doctype/tab_asset_request/${supOwnReqId}/approve`,
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['usman']}` }
  });
  record('SEC-04-F', 'Asset/Security', 'Block Supervisor from Self-Approving Own Asset Request', 'Supervisor', 403, supSelfApprove.statusCode, supSelfApprove.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', supSelfApprove.data?.message);

  // =========================================================================
  // REMEDIATION VERIFICATION: BUG-SEC-05 (IDOR ACCESS TO FINANCIAL REGISTERS)
  // =========================================================================
  console.log('\n--- VERIFYING BUG-SEC-05: FINANCIAL RECORD IDOR PROTECTION ---');

  // Employee attempting to read utility bill by direct ID
  const empGetBill = await request({ path: '/api/doctype/tab_utility_bill/UTIL-2026-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  record('SEC-05-A', 'Finance/Security', 'Block Employee from Utility Bill IDOR', 'Employee', 403, empGetBill.statusCode, empGetBill.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empGetBill.data?.message);

  // Employee attempting to read kitchen expense by direct ID
  const empGetKitchen = await request({ path: '/api/doctype/tab_kitchen_expense/KIT-2026-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  record('SEC-05-B', 'Finance/Security', 'Block Employee from Kitchen Expense IDOR', 'Employee', 403, empGetKitchen.statusCode, empGetKitchen.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empGetKitchen.data?.message);

  // Employee attempting to read expense claim by direct ID
  const empGetClaim = await request({ path: '/api/doctype/tab_expense_claim/EXP-2026-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  record('SEC-05-C', 'Finance/Security', 'Block Employee from Expense Claim IDOR', 'Employee', 403, empGetClaim.statusCode, empGetClaim.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical', empGetClaim.data?.message);

  // Authorized Logistics Admin access to utility bill
  const logGetBill = await request({ path: '/api/doctype/tab_utility_bill/UTIL-2026-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['bilal']}` } });
  record('SEC-05-D', 'Finance/Security', 'Logistics Admin Authorized Utility Bill Access', 'Logistics Admin', 200, logGetBill.statusCode, logGetBill.statusCode === 200 ? 'PASS' : 'FAIL', 'High', `Amount: Rs. ${logGetBill.data?.doc?.amount_pkr}`);

  // Authorized CEO access to utility bill
  const ceoGetBill = await request({ path: '/api/doctype/tab_utility_bill/UTIL-2026-0001', method: 'GET', headers: { Authorization: `Bearer ${tokens['ceo']}` } });
  record('SEC-05-E', 'Finance/Security', 'CEO Authorized Utility Bill Access', 'CEO', 200, ceoGetBill.statusCode, ceoGetBill.statusCode === 200 ? 'PASS' : 'FAIL', 'High');

  // =========================================================================
  // REMEDIATION VERIFICATION: BUG-SEC-06 (UNAUTHORIZED UTILITY BILL CREATION)
  // =========================================================================
  console.log('\n--- VERIFYING BUG-SEC-06: FINANCIAL RECORD CREATION RESTRICTION ---');

  // Employee attempting to create a utility bill
  const empCreateBill = await request({
    path: '/api/doctype/tab_utility_bill',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  }, {
    utility_type: 'Electricity (IESCO)',
    amount_pkr: 500000,
    billing_month: 'October 2026'
  });
  record('SEC-06-A', 'Finance/Security', 'Block Employee from Creating Utility Bill', 'Employee', 403, empCreateBill.statusCode, empCreateBill.statusCode === 403 ? 'PASS' : 'FAIL', 'High', empCreateBill.data?.message);

  // Employee attempting to create a kitchen expense
  const empCreateKitchen = await request({
    path: '/api/doctype/tab_kitchen_expense',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['zainab']}` }
  }, {
    description: 'Unauthorized Party Snacks',
    amount_pkr: 25000
  });
  record('SEC-06-B', 'Finance/Security', 'Block Employee from Creating Kitchen Expense', 'Employee', 403, empCreateKitchen.statusCode, empCreateKitchen.statusCode === 403 ? 'PASS' : 'FAIL', 'High', empCreateKitchen.data?.message);

  // Supervisor attempting to create a utility bill
  const supCreateBill = await request({
    path: '/api/doctype/tab_utility_bill',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['usman']}` }
  }, {
    utility_type: 'Electricity (IESCO)',
    amount_pkr: 100000
  });
  record('SEC-06-C', 'Finance/Security', 'Block Supervisor from Creating Utility Bill', 'Supervisor', 403, supCreateBill.statusCode, supCreateBill.statusCode === 403 ? 'PASS' : 'FAIL', 'High', supCreateBill.data?.message);

  // Authorized Logistics Admin creates a utility bill
  const logCreateBill = await request({
    path: '/api/doctype/tab_utility_bill',
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['bilal']}` }
  }, {
    utility_type: 'Fiber Internet (PTCL Dedicated)',
    consumer_no: '04-9988-1122-F',
    amount_pkr: 85000,
    due_date: '2026-11-15',
    billing_month: 'November 2026'
  });
  record('SEC-06-D', 'Finance/Security', 'Logistics Admin Authorized Bill Creation', 'Logistics Admin', 201, logCreateBill.statusCode, logCreateBill.statusCode === 201 ? 'PASS' : 'FAIL', 'High', `Created: ${logCreateBill.data?.doc?.name}`);

  // =========================================================================
  // REGRESSION TESTS: PRESERVE EXISTING VALID WORKFLOWS
  // =========================================================================
  console.log('\n--- VERIFYING REGRESSION: WORKSPACES, TASKS, & MONTHLY REPORTS ---');

  // Workspaces verification
  const wsCEO = await request({ path: '/api/desk/workspaces', method: 'GET', headers: { Authorization: `Bearer ${tokens['ceo']}` } });
  record('REG-WS-01', 'Desk', 'CEO Executive Desk Data Available', 'CEO', true, wsCEO.data?.financialSummary !== null, wsCEO.data?.financialSummary !== null ? 'PASS' : 'FAIL', 'High');

  const wsEmp = await request({ path: '/api/desk/workspaces', method: 'GET', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  record('REG-WS-02', 'Desk', 'Employee Workspace Data Redacted', 'Employee', null, wsEmp.data?.financialSummary, wsEmp.data?.financialSummary === null ? 'PASS' : 'FAIL', 'High');

  // Task component completion toggle
  const toggleRes = await request({ path: '/api/doctype/tab_task_component/COMP-2026-0005/toggle', method: 'POST', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  record('REG-TASK-01', 'Task/WBS', 'Employee Toggles Task Component', 'Employee', 200, toggleRes.statusCode, toggleRes.statusCode === 200 ? 'PASS' : 'FAIL', 'High', `Progress: ${toggleRes.data?.task?.progress}%`);

  // Monthly reports workflow
  const periodsRes = await request({ path: '/api/monthly-reports/periods', method: 'GET', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  record('REG-MPR-01', 'Reporting', 'List Monthly Reporting Periods', 'Employee', 200, periodsRes.statusCode, periodsRes.statusCode === 200 && periodsRes.data?.periods?.length > 0 ? 'PASS' : 'FAIL', 'High');

  const myRepsRes = await request({ path: '/api/monthly-reports/my-reports', method: 'GET', headers: { Authorization: `Bearer ${tokens['zainab']}` } });
  record('REG-MPR-02', 'Reporting', 'Employee Retrieves Own Reports', 'Employee', 200, myRepsRes.statusCode, myRepsRes.statusCode === 200 ? 'PASS' : 'FAIL', 'High', `Count: ${myRepsRes.data?.count}`);

  const submittedLockRes = await request({ path: '/api/monthly-reports/MPR-2026-0001', method: 'PUT', headers: { Authorization: `Bearer ${tokens['zainab']}` } }, { monthly_remarks: 'Tampering attempt' });
  record('REG-MPR-03', 'Reporting', 'Submitted Monthly Report Immutability (ISO Locked)', 'Employee', 403, submittedLockRes.statusCode, submittedLockRes.statusCode === 403 ? 'PASS' : 'FAIL', 'Critical');

  const crossIdorRes = await request({ path: '/api/monthly-reports/MPR-2026-0003', method: 'GET', headers: { Authorization: `Bearer ${tokens['taha']}` } });
  record('REG-MPR-04', 'Reporting', 'Prevent Cross-Employee Viewing of Another Draft', 'Employee', 403, crossIdorRes.statusCode, crossIdorRes.statusCode === 403 ? 'PASS' : 'FAIL', 'High');

  const mgmtOverviewCEO = await request({ path: '/api/monthly-reports/management/overview', method: 'GET', headers: { Authorization: `Bearer ${tokens['ceo']}` } });
  record('REG-MPR-05', 'Reporting', 'CEO Management Overview Accessible', 'CEO', 200, mgmtOverviewCEO.statusCode, mgmtOverviewCEO.statusCode === 200 ? 'PASS' : 'FAIL', 'High', `Personnel in scope: ${mgmtOverviewCEO.data?.summary?.totalEmployeesInScope}`);

  // Summary
  console.log('\n========================================================');
  console.log('  PHASE 1 SECURITY REGRESSION RUN COMPLETE');
  console.log('========================================================');
  const passCount = tests.filter(t => t.status === 'PASS').length;
  const failCount = tests.filter(t => t.status === 'FAIL').length;
  console.log(`Total Executed: ${tests.length}`);
  console.log(`Passed:         ${passCount} (${Math.round((passCount/tests.length)*100)}%)`);
  console.log(`Failed:         ${failCount} (${Math.round((failCount/tests.length)*100)}%)`);

  require('fs').writeFileSync('c:/Users/Taha/Desktop/testssss/haalar-desk/security_phase1_results.json', JSON.stringify({
    total: tests.length,
    passed: passCount,
    failed: failCount,
    tests
  }, null, 2));
}

run().catch(console.error);
