// Standalone Fallback Dataset for Haalar Desk
export const getFallbackWorkspaceData = (role: string = 'CEO') => {
  const allEmployees = [
    { name: 'HR-EMP-0001', employee_name: 'Sohail (Managing Director)', department: 'Executive Directorate', designation: 'Chief Executive Officer', status: 'Active', date_of_joining: '2020-01-15', current_task: 'Strategic Defense Contracts', past_projects: ['SkyGuard Phase 1', 'Telemetry Link Gen 1'], project_activity_timeline: [{ month: 'Jan', projects: 2 }, { month: 'Jun', projects: 3 }, { month: 'Oct', projects: 4 }] },
    { name: 'HR-EMP-0002', employee_name: 'Usman (Hardware Lead)', department: 'RF & Microwave Engineering', designation: 'Lead Hardware Architect', status: 'Active', date_of_joining: '2021-03-01', current_task: 'Radar DSP Core Architecture', past_projects: ['S-Band Transceiver', 'C-Band Power Amplifier'], project_activity_timeline: [{ month: 'Jan', projects: 1 }, { month: 'Jun', projects: 3 }, { month: 'Oct', projects: 3 }] },
    { name: 'HR-EMP-0003', employee_name: 'Bilal (Logistics & Facilities)', department: 'Procurement & Logistics', designation: 'Logistics & Facilities Director', status: 'Active', date_of_joining: '2021-06-15', current_task: 'Long-Lead Military IC Buffer Procurement', past_projects: ['Cleanroom HVAC Setup', 'Component Bin Registry'], project_activity_timeline: [{ month: 'Jan', projects: 1 }, { month: 'Jun', projects: 2 }, { month: 'Oct', projects: 2 }] },
    { name: 'HR-EMP-0004', employee_name: 'Zainab (Lead Firmware Engineer)', department: 'Embedded Software', designation: 'Embedded Firmware Specialist', status: 'Active', date_of_joining: '2022-02-10', current_task: 'Telemetry ECU Microcontroller Firmware', past_projects: ['CAN Bus Protocol Stack', 'Bootloader CRC Engine'], project_activity_timeline: [{ month: 'Jan', projects: 2 }, { month: 'Jun', projects: 2 }, { month: 'Oct', projects: 2 }] },
    { name: 'HR-EMP-0005', employee_name: 'Taha (Hardware Prototyping Engineer)', department: 'Electronics Design', designation: 'Lead Prototyping Engineer', status: 'Active', date_of_joining: '2022-08-01', current_task: 'FPGA Gigabit Transceiver Validation', past_projects: ['Differential Trace TDR Analysis'], project_activity_timeline: [{ month: 'Jan', projects: 1 }, { month: 'Jun', projects: 2 }, { month: 'Oct', projects: 2 }] },
    { name: 'HR-EMP-0006', employee_name: 'Nouman (Embedded Systems Engineer)', department: 'Avionics Systems', designation: 'Embedded Systems Specialist', status: 'Active', date_of_joining: '2023-01-20', current_task: 'Real-Time Sensor Fusion Telemetry', past_projects: ['IMU Calibration Jig', 'SPI Bus Driver'], project_activity_timeline: [{ month: 'Jan', projects: 1 }, { month: 'Jun', projects: 1 }, { month: 'Oct', projects: 2 }] },
    { name: 'HR-EMP-0007', employee_name: 'Ayesha Tariq', department: 'Quality Assurance', designation: 'Senior QA & Reliability Specialist', status: 'Active', date_of_joining: '2023-04-12', current_task: 'MIL-STD-810G Thermal Soak Test', past_projects: ['Vibration Testing Protocol'], project_activity_timeline: [{ month: 'Jan', projects: 1 }, { month: 'Jun', projects: 2 }, { month: 'Oct', projects: 2 }] },
    { name: 'HR-EMP-0008', employee_name: 'Hamza Malik', department: 'RF & Microwave Engineering', designation: 'RF Test Bench Lead', status: 'Active', date_of_joining: '2023-09-01', current_task: 'Harmonic Distortion & S-Parameter Bench Testing', past_projects: ['Power Meter Calibrations'], project_activity_timeline: [{ month: 'Jan', projects: 0 }, { month: 'Jun', projects: 1 }, { month: 'Oct', projects: 2 }] },
    { name: 'HR-EMP-0009', employee_name: 'Mariam Siddiqui', department: 'PCB Design & Assembly', designation: 'Senior IPC Cleanroom Specialist', status: 'Active', date_of_joining: '2024-01-15', current_task: '12-Layer Rigid-Flex Board Assembly', past_projects: ['0201 Component SMT Profiling'], project_activity_timeline: [{ month: 'Jan', projects: 1 }, { month: 'Jun', projects: 1 }, { month: 'Oct', projects: 1 }] },
    { name: 'HR-EMP-0010', employee_name: 'Danish Raza', department: 'Embedded Software', designation: 'DSP Algorithm Engineer', status: 'Active', date_of_joining: '2024-05-10', current_task: 'FFT Acceleration on Artix-7 FPGA', past_projects: ['Fixed-Point FIR Filter Design'], project_activity_timeline: [{ month: 'Jan', projects: 0 }, { month: 'Jun', projects: 1 }, { month: 'Oct', projects: 1 }] },
    { name: 'HR-EMP-0011', employee_name: 'Fatima Noor', department: 'Procurement & Logistics', designation: 'Inventory & ERP Specialist', status: 'Active', date_of_joining: '2024-08-01', current_task: 'Customs Clearance for Keysight Differential Probes', past_projects: ['Bin Barcoding Overhaul'], project_activity_timeline: [{ month: 'Jan', projects: 0 }, { month: 'Jun', projects: 0 }, { month: 'Oct', projects: 1 }] },
    { name: 'HR-EMP-0012', employee_name: 'Saad Farooq', department: 'Facilities & Safety', designation: 'Cleanroom ESD Coordinator', status: 'Active', date_of_joining: '2025-02-01', current_task: 'Monthly ESD Mat Resistance Certification', past_projects: ['Facility Earthing Grid Upgrade'], project_activity_timeline: [{ month: 'Jan', projects: 0 }, { month: 'Jun', projects: 0 }, { month: 'Oct', projects: 1 }] }
  ];

  const allAssets = [
    { name: 'ASSET-0001', asset_name: 'Tektronix 4-Channel 1GHz Phosphor Oscilloscope', asset_category: 'RF & Spectrum Test Equipment', status: 'In-Use', custodian_name: 'Usman (Hardware Lead)', gross_purchase_amount_pkr: 2850000 },
    { name: 'ASSET-0002', asset_name: 'Rohde & Schwarz 13.6GHz Spectrum Analyzer', asset_category: 'RF & Spectrum Test Equipment', status: 'In-Use', custodian_name: 'Hamza Malik', gross_purchase_amount_pkr: 4600000 },
    { name: 'ASSET-0003', asset_name: 'NeoDen Automated Desktop Vision Pick & Place', asset_category: 'SMT Assembly & Soldering', status: 'Available', custodian_name: null, gross_purchase_amount_pkr: 1950000 },
    { name: 'ASSET-0004', asset_name: 'Weiß Technik Environmental Thermal Soak Chamber', asset_category: 'Environmental Test Chambers', status: 'Under Maintenance', custodian_name: null, gross_purchase_amount_pkr: 5200000 },
    { name: 'ASSET-0005', asset_name: 'Keysight 30V 10A Programmable DC Lab Supply', asset_category: 'Power & Calibration Bench', status: 'Available', custodian_name: null, gross_purchase_amount_pkr: 420000 },
    { name: 'ASSET-0006', asset_name: 'JBC Precision Quad SMD Rework Station', asset_category: 'SMT Assembly & Soldering', status: 'In-Use', custodian_name: 'Mariam Siddiqui', gross_purchase_amount_pkr: 380000 }
  ];

  const tasks = [
    {
      name: 'TASK-2026-0001',
      project: 'PRJ-2026-0001',
      task_subject: 'Radar DSP Core Architecture & High-Speed DDR3 Interface',
      assigned_to_name: 'Usman (Hardware Lead)',
      assigned_to: 'HR-EMP-0002',
      exp_start_date: '2026-10-01',
      exp_end_date: '2026-11-15',
      priority: 'Urgent',
      status: 'Working',
      progress: 65,
      equipment_required: 'Tektronix 4-Channel 1GHz Phosphor Oscilloscope (ASSET-0001)',
      totalComponents: 4,
      completedComponents: 3,
      components: [
        { name: 'COMP-001', task: 'TASK-2026-0001', component_title: 'DDR3 routing length matching (±5 mil skew tolerance)', is_completed: 1, completed_at: '2026-10-08 14:00', notes: 'Completed within 3 mil tolerance.' },
        { name: 'COMP-002', task: 'TASK-2026-0001', component_title: 'Eye-diagram jitter measurement at 800 MHz DDR3 rate', is_completed: 1, completed_at: '2026-10-14 11:30', notes: 'Measured 42ps peak-to-peak jitter.' },
        { name: 'COMP-003', task: 'TASK-2026-0001', component_title: 'Power distribution network (PDN) target impedance under 15mΩ', is_completed: 1, completed_at: '2026-10-19 16:20', notes: 'Decoupling array simulated and verified.' },
        { name: 'COMP-004', task: 'TASK-2026-0001', component_title: 'FPGA thermal soak testing at +75°C cleanroom chamber', is_completed: 0, completed_at: null, notes: 'Waiting for chamber slot calibration.' }
      ]
    },
    {
      name: 'TASK-2026-0002',
      project: 'PRJ-2026-0002',
      task_subject: 'Telemetry ECU Microcontroller Firmware & Dual-Bank Flash Failover',
      assigned_to_name: 'Zainab (Lead Firmware Engineer)',
      assigned_to: 'HR-EMP-0004',
      exp_start_date: '2026-10-10',
      exp_end_date: '2026-11-05',
      priority: 'High',
      status: 'Working',
      progress: 50,
      equipment_required: 'Keysight 30V 10A Programmable DC Lab Supply (ASSET-0005)',
      totalComponents: 4,
      completedComponents: 2,
      components: [
        { name: 'COMP-005', task: 'TASK-2026-0002', component_title: 'SPI NOR flash dual-bank bootloader partition table', is_completed: 1, completed_at: '2026-10-15 10:00', notes: 'A/B swapping verified.' },
        { name: 'COMP-006', task: 'TASK-2026-0002', component_title: 'CRC32 image integrity check before runtime kernel jump', is_completed: 1, completed_at: '2026-10-20 17:00', notes: 'Hardware CRC32 peripheral benchmarked at 2.4ms.' },
        { name: 'COMP-007', task: 'TASK-2026-0002', component_title: 'Brownout voltage glitch injection test at 2.85V', is_completed: 0, completed_at: null, notes: 'Awaiting DC bench power supply.' },
        { name: 'COMP-008', task: 'TASK-2026-0002', component_title: 'CAN-FD telemetry broadcast packet rate verification at 5 Mbps', is_completed: 0, completed_at: null, notes: 'Scheduled for next bench cycle.' }
      ]
    }
  ];

  const projectPhases = [
    { name: 'PH-01', project: 'PRJ-2026-0001', phase_name: 'Phase 1: Architecture & Schematic Capture', start_date: '2026-10-01', due_date: '2026-10-18', progress: 100, milestone: 'PDR Sign-off' },
    { name: 'PH-02', project: 'PRJ-2026-0001', phase_name: 'Phase 2: High-Speed PCB Layout & DRC', start_date: '2026-10-19', due_date: '2026-11-08', progress: 65, milestone: 'CDR Sign-off' },
    { name: 'PH-03', project: 'PRJ-2026-0001', phase_name: 'Phase 3: Cleanroom SMD Assembly', start_date: '2026-11-09', due_date: '2026-11-20', progress: 0, milestone: 'Board Power-On' },
    { name: 'PH-04', project: 'PRJ-2026-0002', phase_name: 'Phase 1: Firmware Architecture & HAL', start_date: '2026-10-10', due_date: '2026-10-28', progress: 75, milestone: 'HAL Release' }
  ];

  const teamWorkload = [
    {
      empId: 'HR-EMP-0002',
      fullName: 'Usman (Hardware Lead)',
      designation: 'Lead Hardware Architect',
      totalAllocationPercent: 85,
      status: 'Optimal Load',
      benchLocation: 'RF Testing Lab - Bench A',
      activeTasksCount: 3,
      headroomPercent: 15,
      projectAllocations: [
        { project: 'Radar DSP Core', percent: 45, color: '#3b82f6' },
        { project: 'Telemetry ECU', percent: 30, color: '#8b5cf6' },
        { project: 'Lab Calibration', percent: 10, color: '#10b981' }
      ]
    },
    {
      empId: 'HR-EMP-0004',
      fullName: 'Zainab (Lead Firmware Engineer)',
      designation: 'Embedded Firmware Specialist',
      totalAllocationPercent: 75,
      status: 'Optimal Load',
      benchLocation: 'Embedded Hardware Bay',
      activeTasksCount: 2,
      headroomPercent: 25,
      projectAllocations: [
        { project: 'Telemetry ECU', percent: 50, color: '#8b5cf6' },
        { project: 'Radar DSP Core', percent: 25, color: '#3b82f6' }
      ]
    }
  ];

  const inventoryBulletGauges = [
    { itemCode: 'ITEM-0001', itemName: 'Xilinx Artix-7 XC7A100T-2CSG324I FPGA', currentStock: 45, safetyStock: 20, targetBuffer: 50, leadTimeDays: 14, uom: 'Nos', binLocation: 'Rack B - Bin 04', status: 'Optimal', stockCoverageDays: 95 },
    { itemCode: 'ITEM-0002', itemName: 'Keysight 50-Ohm Semi-Rigid Coaxial Cable', currentStock: 12, safetyStock: 8, targetBuffer: 25, leadTimeDays: 7, uom: 'Mtr', binLocation: 'Rack A - Bin 12', status: 'Optimal', stockCoverageDays: 45 }
  ];

  const evmData = {
    summary: { overallCPI: 1.08, overallSPI: 1.00, costEfficiency: 'Under Budget (+Rs. 1,870,000)' },
    projects: [
      { projectId: 'PRJ-2026-0001', projectName: 'Radar DSP Core Architecture', budgetPKR: 15500000, cpi: 1.08, spi: 1.00, costVariancePKR: 1350000 },
      { projectId: 'PRJ-2026-0002', projectName: 'Telemetry ECU & Avionics Unit', budgetPKR: 9800000, cpi: 1.09, spi: 1.00, costVariancePKR: 520000 }
    ],
    monthlyCurves: [
      { month: 'Jun', plannedValue: 4200000, earnedValue: 4100000, actualCost: 3900000 },
      { month: 'Jul', plannedValue: 8500000, earnedValue: 8200000, actualCost: 7700000 },
      { month: 'Aug', plannedValue: 12800000, earnedValue: 12400000, actualCost: 11600000 },
      { month: 'Sep', plannedValue: 16900000, earnedValue: 16500000, actualCost: 15400000 },
      { month: 'Oct (Current)', plannedValue: 20570000, earnedValue: 20245000, actualCost: 18700000 }
    ]
  };

  const equipmentStats = {
    totalAssets: 6,
    byStatus: [
      { name: 'In-Use', value: 3, color: '#3b82f6' },
      { name: 'Available', value: 2, color: '#10b981' },
      { name: 'Under Maintenance', value: 1, color: '#f59e0b' }
    ],
    byCategory: [
      { name: 'RF & Spectrum', count: 2, value: 2, value_pkr: 7450000, color: '#6366f1' },
      { name: 'SMT Assembly', count: 2, value: 2, value_pkr: 2330000, color: '#ec4899' },
      { name: 'Environmental', count: 1, value: 1, value_pkr: 5200000, color: '#8b5cf6' },
      { name: 'Power & Cal', count: 1, value: 1, value_pkr: 420000, color: '#14b8a6' }
    ]
  };

  const expenseTrends = {
    monthly: [
      { period: 'Jun', utilities: 410000, kitchen: 12000, operations: 120000, total: 542000 },
      { period: 'Jul', utilities: 430000, kitchen: 10800, operations: 115000, total: 555800 },
      { period: 'Aug', utilities: 445000, kitchen: 11200, operations: 130000, total: 586200 },
      { period: 'Sep', utilities: 435000, kitchen: 10500, operations: 145000, total: 590500 },
      { period: 'Oct', utilities: 420000, kitchen: 12500, operations: 129800, total: 562300 }
    ],
    quarterly: [
      { period: 'Q1 2026', utilities: 975000, kitchen: 29500, operations: 247000, total: 1251500 },
      { period: 'Q2 2026', utilities: 1160000, kitchen: 34500, operations: 313000, total: 1507500 },
      { period: 'Q3 2026', utilities: 1310000, kitchen: 32500, operations: 390000, total: 1732500 },
      { period: 'Q4 2026 (Est)', utilities: 1350000, kitchen: 35000, operations: 420000, total: 1805000 }
    ],
    annual: [
      { period: '2024', utilities: 3200000, kitchen: 95000, operations: 850000, total: 4145000 },
      { period: '2025', utilities: 4100000, kitchen: 115000, operations: 1200000, total: 5415000 },
      { period: '2026 (YTD)', utilities: 4800500, kitchen: 107500, operations: 1133000, total: 6041000 }
    ]
  };

  const assetRequests = [
    { name: 'REQ-2026-0001', asset: 'ASSET-0001', asset_name: 'Tektronix 4-Channel 1GHz Phosphor Oscilloscope', requested_by_name: 'Usman (Hardware Lead)', purpose: 'Radar DSP DDR3 eye diagram capture', status: 'Approved', start_date: '2026-10-18', return_date: '2026-10-28' },
    { name: 'REQ-2026-0002', asset: 'ASSET-0002', asset_name: 'Rohde & Schwarz 13.6GHz Spectrum Analyzer', requested_by_name: 'Hamza Malik', purpose: 'Harmonic distortion bench testing', status: 'Approved', start_date: '2026-10-20', return_date: '2026-10-25' },
    { name: 'REQ-2026-0003', asset: 'ASSET-0005', asset_name: 'Keysight 30V 10A Programmable DC Lab Supply', requested_by_name: 'Zainab (Lead Firmware Engineer)', purpose: 'Telemetry ECU brownout glitch testing', status: 'Pending Approval', start_date: '2026-10-23', return_date: '2026-10-27' }
  ];

  const expensesLedger = {
    utilityBills: [
      { name: 'UTIL-2026-0001', bill_type: 'Electricity (IESCO Heavy Industrial)', billing_period: 'September 2026', amount_pkr: 325400, due_date: '2026-10-15', status: 'Paid', payment_date: '2026-10-12' },
      { name: 'UTIL-2026-0002', bill_type: 'Natural Gas (SNGPL Commercial Heating)', billing_period: 'September 2026', amount_pkr: 48900, due_date: '2026-10-18', status: 'Paid', payment_date: '2026-10-16' },
      { name: 'UTIL-2026-0003', bill_type: 'Fiber Internet (Nayatel 100Mbps Dedicated)', billing_period: 'October 2026', amount_pkr: 45700, due_date: '2026-10-28', status: 'Unpaid', payment_date: null }
    ],
    kitchenExpenses: [
      { name: 'KIT-2026-0001', description: 'Weekly Milk, Tea & Coffee Supplies for Engineering Floor', amount_pkr: 4800, expense_date: '2026-10-19', vendor_store: 'Metro Cash & Carry Islamabad', recorded_by: 'Bilal (Logistics)' },
      { name: 'KIT-2026-0002', description: 'Emergency Water Filtration Cartridge Replacement', amount_pkr: 7700, expense_date: '2026-10-21', vendor_store: 'AquaSafe Systems Rawalpindi', recorded_by: 'Bilal (Logistics)' }
    ],
    expenseClaims: [
      { name: 'EXP-2026-0001', employee_name: 'Usman (Hardware Lead)', description: 'Express DHL Duty for Xilinx Artix-7 Samples', total_amount_pkr: 18500, status: 'Approved', posting_date: '2026-10-18' },
      { name: 'EXP-2026-0002', employee_name: 'Hamza Malik', description: 'RF Calibration Toroid Adapter & BNC Couplers', total_amount_pkr: 9400, status: 'Approved', posting_date: '2026-10-20' }
    ]
  };

  const calendarDays = [];
  for (let day = 1; day <= 31; day++) {
    const isWeekend = (day % 7 === 3 || day % 7 === 4);
    calendarDays.push({
      day,
      date: `2026-10-${day.toString().padStart(2, '0')}`,
      status: day > 23 ? 'Future' : isWeekend ? 'Weekend' : day === 9 ? 'Absent' : day === 15 ? 'Leave' : 'Present',
      checkIn: day > 23 || isWeekend ? null : '08:48 AM',
      checkOut: day > 23 || isWeekend ? null : day === 23 ? 'In Progress' : '05:15 PM',
      hours: day > 23 || isWeekend ? 0 : 8.5
    });
  }

  const allWorkspaces = [
    {
      id: 'executive',
      title: 'Executive Desk',
      icon: 'Building2',
      allowedRoles: ['CEO'],
      numberCards: [
        { label: 'Total Monthly Burn', value: 'Rs. 562,300' },
        { label: 'Active Projects', value: '2 Projects' },
        { label: 'Project Margin Balance', value: 'Rs. 2,640,000' },
        { label: 'Equipment Deployed', value: '3 / 6 In-Use' }
      ]
    },
    {
      id: 'supervisor',
      title: 'Supervisor Desk',
      icon: 'UserCheck',
      allowedRoles: ['CEO', 'Supervisor'],
      numberCards: [
        { label: 'Staff Present Today', value: '11 / 12' },
        { label: 'Equipment Checked Out', value: '3' },
        { label: 'Pending Approvals', value: '1 Checkout' }
      ]
    },
    {
      id: 'operations',
      title: 'Logistics & Facilities',
      icon: 'Boxes',
      allowedRoles: ['CEO', 'Logistics Admin'],
      numberCards: [
        { label: 'Kitchen & Canteen Spend', value: 'Rs. 12,500' },
        { label: 'Utility Invoices', value: 'Rs. 420,000' },
        { label: 'Inventory Items', value: '2 Parts' }
      ]
    },
    {
      id: 'my_space',
      title: 'My Workspace',
      icon: 'User',
      allowedRoles: ['CEO', 'Supervisor', 'Logistics Admin', 'Employee'],
      numberCards: [
        { label: 'My Status Today', value: 'Active on Duty' },
        { label: 'My Assigned Tools', value: '1 Tool in Custody' },
        { label: 'My Annual Leave Balance', value: '11 Days Remaining' }
      ]
    }
  ];

  return {
    success: true,
    workspaces: allWorkspaces.filter(ws => ws.allowedRoles.includes(role)),
    tasks,
    allEmployees,
    assetRequests,
    allAssets,
    monthlyReports: [
      {
        name: 'MPR-2026-0001',
        creation: '2026-09-28 09:15:00',
        modified: '2026-09-30 16:45:00',
        modified_by: 'zainab@haalar.com',
        owner: 'zainab@haalar.com',
        docstatus: 1,
        status: 'Submitted',
        employee: 'HR-EMP-0004',
        employee_name: 'Zainab (Lead Firmware Engineer)',
        department: 'Embedded Software',
        designation: 'Embedded Firmware Specialist',
        user_id: 'zainab@haalar.com',
        reporting_month: 'September',
        reporting_year: 2026,
        report_period_key: '2026-09',
        generated_on: '2026-09-28 09:15:00 PKT',
        submitted_on: '2026-09-30 16:45:00 PKT',
        monthly_remarks: 'All September milestones for CAN-Bus protocol and dual-bank bootloader integration completed on schedule. Awaiting environmental chamber slot for thermal stress testing.',
        tasks: [
          {
            task_id: 'TASK-2026-0002',
            task_subject: 'Telemetry ECU CAN-Bus Driver & Bootloader Verification',
            project: 'PRJ-2026-0002',
            project_name: 'Telemetry ECU & Avionics Interface Unit',
            task_status: 'Working',
            progress: 50,
            employee_description: 'Designed SPI flash partition table and benchmarked hardware CRC32 image verification engine at 2.4ms execution time on Artix-7 target.'
          }
        ]
      },
      {
        name: 'MPR-2026-0002',
        creation: '2026-09-29 11:00:00',
        modified: '2026-09-30 17:20:00',
        modified_by: 'taha@haalar.com',
        owner: 'taha@haalar.com',
        docstatus: 1,
        status: 'Submitted',
        employee: 'HR-EMP-0005',
        employee_name: 'Taha (Hardware Prototyping Engineer)',
        department: 'Electronics Design',
        designation: 'Lead Prototyping Engineer',
        user_id: 'taha@haalar.com',
        reporting_month: 'September',
        reporting_year: 2026,
        report_period_key: '2026-09',
        generated_on: '2026-09-29 11:00:00 PKT',
        submitted_on: '2026-09-30 17:20:00 PKT',
        monthly_remarks: 'Completed high-speed differential signal integrity routing on radar PCB prototypes; all DDR3 length match tolerances verified within 3 mils.',
        tasks: [
          {
            task_id: 'TASK-2026-0001',
            task_subject: 'Radar DSP Core Architecture & High-Speed DDR3 Interface',
            project: 'PRJ-2026-0001',
            project_name: 'Radar DSP High-Speed Digital Processing Core',
            task_status: 'Working',
            progress: 65,
            employee_description: 'Executed TDR impedance analysis on 50-ohm single-ended and 100-ohm differential microstrips; cleared all DRC violation flags.'
          }
        ]
      },
      {
        name: 'MPR-2026-0003',
        creation: '2026-10-24 10:30:00',
        modified: '2026-10-28 14:15:00',
        modified_by: 'zainab@haalar.com',
        owner: 'zainab@haalar.com',
        docstatus: 0,
        status: 'Draft',
        employee: 'HR-EMP-0004',
        employee_name: 'Zainab (Lead Firmware Engineer)',
        department: 'Embedded Software',
        designation: 'Embedded Firmware Specialist',
        user_id: 'zainab@haalar.com',
        reporting_month: 'October',
        reporting_year: 2026,
        report_period_key: '2026-10',
        generated_on: '2026-10-24 10:30:00 PKT',
        submitted_on: null,
        monthly_remarks: 'Draft in progress for October reporting cycle. Telemetry firmware bench testing ongoing.',
        tasks: [
          {
            task_id: 'TASK-2026-0002',
            task_subject: 'Telemetry ECU CAN-Bus Driver & Bootloader Verification',
            project: 'PRJ-2026-0002',
            project_name: 'Telemetry ECU & Avionics Interface Unit',
            task_status: 'Working',
            progress: 65,
            employee_description: 'Integrated CAN-FD driver with 5 Mbps broadcast rate; validated flash failover during simulated brownout conditions.'
          }
        ]
      }
    ],
    projectPhases,
    teamWorkload,
    inventoryBulletGauges,
    evmData,
    equipmentStats,
    expenseTrends,
    expensesLedger,
    attendanceCalendar: {
      month: 'October 2026',
      totalDays: 31,
      presentCount: 15,
      absentCount: 1,
      leaveCount: 1,
      workingDays: 17,
      days: calendarDays
    },
    financialSummary: {
      totalBurnPKR: 562300,
      utilitiesPKR: 420000,
      kitchenPKR: 12500,
      expensesPKR: 129800,
      projectAllocatedPKR: 25300000,
      projectSpentPKR: 22660000,
      projectBalancePKR: 2640000
    }
  };
};
