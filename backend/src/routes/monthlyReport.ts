import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { erpStore } from '../services/store';

export const monthlyReportRouter = Router();

monthlyReportRouter.use(authenticate);

// Helper to format Pakistan Standard Time (PKT)
function getPKTTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} PKT`;
}

// 1. GET AVAILABLE REPORTING PERIODS
monthlyReportRouter.get('/periods', (_req: AuthenticatedRequest, res: Response) => {
  const currentYear = 2026;
  const periods = [
    { month: 'October', year: currentYear, periodKey: `${currentYear}-10`, label: `October ${currentYear} (Current Period)`, isCurrent: true },
    { month: 'September', year: currentYear, periodKey: `${currentYear}-09`, label: `September ${currentYear}`, isCurrent: false },
    { month: 'August', year: currentYear, periodKey: `${currentYear}-08`, label: `August ${currentYear}`, isCurrent: false },
    { month: 'July', year: currentYear, periodKey: `${currentYear}-07`, label: `July ${currentYear}`, isCurrent: false },
    { month: 'June', year: currentYear, periodKey: `${currentYear}-06`, label: `June ${currentYear}`, isCurrent: false }
  ];

  res.json({
    success: true,
    periods
  });
});

// 2. GET AUTHENTICATED EMPLOYEE'S OWN REPORT HISTORY
monthlyReportRouter.get('/my-reports', (req: AuthenticatedRequest, res: Response) => {
  const userEmail = req.user?.email;
  const myEmp = erpStore.tables.tab_employee?.find(e => e.user_id === userEmail);

  const allReports = erpStore.tables.tab_monthly_progress_report || [];
  const reports = allReports.filter(r => 
    r.user_id === userEmail || (myEmp && r.employee === myEmp.name)
  );

  res.json({
    success: true,
    count: reports.length,
    reports
  });
});

// 3. GENERATE A NEW MONTHLY REPORT WORKSHEET
monthlyReportRouter.post('/generate', (req: AuthenticatedRequest, res: Response) => {
  const userEmail = req.user?.email;
  const { month, year } = req.body;

  if (!month || !year) {
    res.status(400).json({ success: false, message: 'Reporting month and year are required.' });
    return;
  }

  // Resolve authenticated employee identity from Employee Master
  const myEmp = erpStore.tables.tab_employee?.find(e => e.user_id === userEmail);
  if (!myEmp) {
    res.status(404).json({ success: false, message: 'Employee master record not found for authenticated user.' });
    return;
  }

  // Month mapping
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = monthNames.findIndex(m => m.toLowerCase() === String(month).toLowerCase());
  const formattedMonth = monthIndex >= 0 ? monthNames[monthIndex] : String(month);
  const padMonth = (monthIndex + 1).toString().padStart(2, '0');
  const periodKey = `${year}-${padMonth}`;

  // Check for duplicate reports for this employee & period (unless cancelled docstatus === 2)
  const existingReports = erpStore.tables.tab_monthly_progress_report || [];
  const duplicate = existingReports.find(r => 
    (r.employee === myEmp.name || r.user_id === userEmail) &&
    r.report_period_key === periodKey &&
    r.docstatus !== 2
  );

  if (duplicate) {
    res.status(409).json({
      success: false,
      message: `A monthly report for ${formattedMonth} ${year} already exists (${duplicate.name}).`,
      existingReportId: duplicate.name,
      report: duplicate
    });
    return;
  }

  // Retrieve tasks assigned to employee from existing Task register
  const allTasks = erpStore.tables.tab_task || [];
  const empTasks = allTasks.filter(t => 
    t.assigned_to === myEmp.name ||
    t.assigned_to === myEmp.employee_code ||
    t.assigned_to === userEmail ||
    t.assigned_to_name === myEmp.employee_name
  );

  // Snapshot assigned tasks into reporting worksheet structure
  const taskSnapshots = empTasks.map((t: any) => ({
    task_id: t.name,
    task_subject: t.task_subject || 'Engineering Deliverable',
    project: t.project || 'PRJ-2026-0001',
    project_name: t.project_name || 'Defense Avionics Project',
    task_status: t.status || 'Working',
    progress: Number(t.progress || 0),
    employee_description: ''
  }));

  // Create new Monthly Progress Report record in Draft status (docstatus: 0)
  const newName = erpStore.getNextSeries('MPR-2026-');
  const nowPKT = getPKTTimestamp();

  const newReport = {
    name: newName,
    creation: new Date().toISOString().replace('T', ' ').substring(0, 19),
    modified: new Date().toISOString().replace('T', ' ').substring(0, 19),
    modified_by: userEmail,
    owner: userEmail,
    docstatus: 0, // 0 = Draft
    status: 'Draft',
    employee: myEmp.name,
    employee_name: myEmp.employee_name,
    department: myEmp.department,
    designation: myEmp.designation,
    user_id: userEmail,
    reporting_month: formattedMonth,
    reporting_year: Number(year),
    report_period_key: periodKey,
    generated_on: nowPKT,
    submitted_on: null,
    monthly_remarks: '',
    tasks: taskSnapshots
  };

  if (!erpStore.tables.tab_monthly_progress_report) {
    erpStore.tables.tab_monthly_progress_report = [];
  }
  erpStore.tables.tab_monthly_progress_report.push(newReport);

  res.status(201).json({
    success: true,
    message: `Monthly Progress Report worksheet generated for ${formattedMonth} ${year}.`,
    report: newReport
  });
});

// 4. MANAGEMENT REPORTING DIRECTORY & OVERVIEW (CEO, Supervisor, Logistics)
monthlyReportRouter.get('/management/overview', (req: AuthenticatedRequest, res: Response) => {
  const role = req.user?.role || 'Employee';

  if (role === 'Employee') {
    res.status(403).json({ success: false, message: 'Access denied: Executive or supervisory clearance required.' });
    return;
  }

  const selectedMonth = String(req.query.month || 'October');
  const selectedYear = Number(req.query.year || 2026);
  const selectedStatus = req.query.status ? String(req.query.status) : null;
  const searchQuery = req.query.search ? String(req.query.search).toLowerCase() : '';

  // Determine organizational scope based on RBAC
  let employeesInScope = [...(erpStore.tables.tab_employee || [])];
  if (role === 'Supervisor') {
    // Engineering department scope
    const engineeringDepts = [
      'Hardware & RF Engineering',
      'Embedded Software',
      'Electronics Design',
      'Avionics Systems',
      'PCB Design & Assembly',
      'Quality Assurance'
    ];
    employeesInScope = employeesInScope.filter(e => engineeringDepts.includes(e.department));
  } else if (role === 'Logistics Admin') {
    // Logistics & supply chain scope
    const logisticsDepts = ['Procurement & Logistics', 'Facilities & Safety'];
    employeesInScope = employeesInScope.filter(e => logisticsDepts.includes(e.department));
  }
  // CEO sees all employees across all departments

  const allReports = erpStore.tables.tab_monthly_progress_report || [];
  
  // Filter reports matching period & scope
  const scopedEmpIds = new Set(employeesInScope.map(e => e.name));
  let periodReports = allReports.filter(r => 
    scopedEmpIds.has(r.employee) &&
    r.reporting_month.toLowerCase() === selectedMonth.toLowerCase() &&
    Number(r.reporting_year) === selectedYear &&
    r.docstatus !== 2 // Exclude cancelled
  );

  // Status filter
  if (selectedStatus) {
    periodReports = periodReports.filter(r => r.status.toLowerCase() === selectedStatus.toLowerCase());
  }

  // Search filter
  if (searchQuery) {
    periodReports = periodReports.filter(r => 
      r.employee_name?.toLowerCase().includes(searchQuery) ||
      r.employee?.toLowerCase().includes(searchQuery) ||
      r.department?.toLowerCase().includes(searchQuery) ||
      r.name?.toLowerCase().includes(searchQuery)
    );
  }

  // Calculate statistics
  const submittedCount = periodReports.filter(r => r.status === 'Submitted').length;
  const draftCount = periodReports.filter(r => r.status === 'Draft').length;
  
  // Identify employees in scope who have not submitted or generated a report for this period
  const reportedEmpIds = new Set(allReports
    .filter(r => r.reporting_month.toLowerCase() === selectedMonth.toLowerCase() && Number(r.reporting_year) === selectedYear && r.docstatus !== 2)
    .map(r => r.employee)
  );

  const missingEmployees = employeesInScope.filter(e => !reportedEmpIds.has(e.name)).map(e => ({
    employee_id: e.name,
    employee_name: e.employee_name,
    department: e.department,
    designation: e.designation,
    status: 'Not Generated'
  }));

  res.json({
    success: true,
    summary: {
      period: `${selectedMonth} ${selectedYear}`,
      totalEmployeesInScope: employeesInScope.length,
      reportsGenerated: periodReports.length,
      reportsSubmitted: submittedCount,
      reportsInDraft: draftCount,
      missingReportsCount: missingEmployees.length
    },
    reports: periodReports,
    missingEmployees
  });
});

// 5. GET SINGLE REPORT BY ID (WITH STRICT RBAC)
monthlyReportRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const user = req.user;
  const role = user?.role || 'Employee';

  const report = erpStore.tables.tab_monthly_progress_report?.find(r => r.name === id);
  if (!report) {
    res.status(404).json({ success: false, message: `Monthly Progress Report '${id}' not found.` });
    return;
  }

  // RBAC verification
  if (role === 'Employee') {
    const isOwner = report.user_id === user?.email || 
      report.employee === erpStore.tables.tab_employee?.find(e => e.user_id === user?.email)?.name;
    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Access denied: You may only view your own monthly progress reports.' });
      return;
    }
  } else if (role === 'Supervisor') {
    // Check engineering department scope
    const engineeringDepts = ['Hardware & RF Engineering', 'Embedded Software', 'Electronics Design', 'Avionics Systems', 'PCB Design & Assembly', 'Quality Assurance'];
    if (!engineeringDepts.includes(report.department)) {
      res.status(403).json({ success: false, message: 'Access denied: Report is outside supervisor engineering department scope.' });
      return;
    }
  } else if (role === 'Logistics Admin') {
    const logisticsDepts = ['Procurement & Logistics', 'Facilities & Safety'];
    if (!logisticsDepts.includes(report.department)) {
      res.status(403).json({ success: false, message: 'Access denied: Report is outside logistics department scope.' });
      return;
    }
  }

  res.json({
    success: true,
    report
  });
});

// 6. UPDATE DRAFT REPORT (SAVE DRAFT)
monthlyReportRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const userEmail = req.user?.email;
  const role = req.user?.role || 'Employee';

  const report = erpStore.tables.tab_monthly_progress_report?.find(r => r.name === id);
  if (!report) {
    res.status(404).json({ success: false, message: `Report '${id}' not found.` });
    return;
  }

  // Immuntability Check: Submitted reports cannot be modified
  if (report.docstatus === 1) {
    res.status(403).json({
      success: false,
      message: 'Submitted reports are permanently locked under ISO compliance and cannot be edited.'
    });
    return;
  }

  // Ownership Check: Only report owner or CEO can update draft
  if (role !== 'CEO' && report.user_id !== userEmail) {
    res.status(403).json({ success: false, message: 'Access denied: You cannot edit another employee\'s report.' });
    return;
  }

  const { monthly_remarks, tasks } = req.body;

  if (typeof monthly_remarks === 'string') {
    report.monthly_remarks = monthly_remarks;
  }

  // Update employee descriptions for task snapshots
  if (Array.isArray(tasks)) {
    tasks.forEach((updatedTask: any) => {
      const existingTask = report.tasks.find((t: any) => t.task_id === updatedTask.task_id);
      if (existingTask && typeof updatedTask.employee_description === 'string') {
        existingTask.employee_description = updatedTask.employee_description;
      }
    });
  }

  report.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);
  report.modified_by = userEmail;

  res.json({
    success: true,
    message: 'Report draft saved successfully.',
    report
  });
});

// 7. SUBMIT REPORT (PERMANENTLY LOCK)
monthlyReportRouter.post('/:id/submit', (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const userEmail = req.user?.email;
  const role = req.user?.role || 'Employee';

  const report = erpStore.tables.tab_monthly_progress_report?.find(r => r.name === id);
  if (!report) {
    res.status(404).json({ success: false, message: `Report '${id}' not found.` });
    return;
  }

  if (report.docstatus === 1) {
    res.status(400).json({ success: false, message: 'This report is already submitted and locked.' });
    return;
  }

  // Ownership Check: Only owner (or CEO) can submit
  if (role !== 'CEO' && report.user_id !== userEmail) {
    res.status(403).json({ success: false, message: 'Access denied: You cannot submit another employee\'s report.' });
    return;
  }

  // Lock report
  report.docstatus = 1; // 1 = Submitted
  report.status = 'Submitted';
  report.submitted_on = getPKTTimestamp();
  report.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);
  report.modified_by = userEmail;

  res.json({
    success: true,
    message: `Monthly Progress Report ${id} submitted successfully and permanently locked.`,
    report
  });
});

// 8. EXPORT / PRINT REPORT PAYLOAD
monthlyReportRouter.get('/:id/export', (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const report = erpStore.tables.tab_monthly_progress_report?.find(r => r.name === id);

  if (!report) {
    res.status(404).json({ success: false, message: `Report '${id}' not found.` });
    return;
  }

  res.json({
    success: true,
    organization: {
      name: 'HAALAR SERVICES',
      division: 'Defense & Aerospace Systems',
      facility: 'Humak Industrial Complex, Sector H-9, Islamabad',
      documentTitle: 'MONTHLY EMPLOYEE PROGRESS REPORT',
      complianceStandard: 'ISO 9001 / AS9100D High-Assurance Engineering'
    },
    report
  });
});
