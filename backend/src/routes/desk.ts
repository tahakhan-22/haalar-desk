import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { erpStore } from '../services/store';

export const deskRouter = Router();

deskRouter.use(authenticate);

// Get available workspaces and dashboard metrics according to role
deskRouter.get('/workspaces', (req: AuthenticatedRequest, res: Response) => {
  const role = req.user?.role || 'Employee';

  // Calculate live numbers
  const totalEmployees = erpStore.tables.tab_employee.length;
  const today = new Date().toISOString().split('T')[0];
  const presentToday = erpStore.tables.tab_attendance.filter(a => a.attendance_date === today && a.status === 'Present').length;
  const totalEquipment = erpStore.tables.tab_asset.length;
  const equipmentInUse = erpStore.tables.tab_asset.filter(a => a.status === 'In-Use').length;
  const totalProjects = erpStore.tables.tab_project.length;

  const totalUtilitiesPKR = erpStore.tables.tab_utility_bill.reduce((acc, u) => acc + Number(u.amount_pkr), 0);
  const totalKitchenPKR = erpStore.tables.tab_kitchen_expense.reduce((acc, k) => acc + Number(k.amount_pkr), 0);
  const totalExpensesPKR = erpStore.tables.tab_expense_claim.reduce((acc, e) => acc + Number(e.total_amount_pkr), 0);
  const totalMonthlyBurnPKR = totalUtilitiesPKR + totalKitchenPKR + totalExpensesPKR;

  const projectAllocatedPKR = erpStore.tables.tab_project.reduce((acc, p) => acc + Number(p.total_budget_pkr), 0);
  const projectSpentPKR = erpStore.tables.tab_project.reduce((acc, p) => acc + Number(p.actual_cost_pkr), 0);

  // Return role-filtered workspace structure
  const allWorkspaces = [
    {
      id: 'executive',
      title: 'Executive Desk',
      icon: 'Building2',
      allowedRoles: ['CEO'],
      numberCards: [
        { label: 'Total Monthly Burn', value: `Rs. ${totalMonthlyBurnPKR.toLocaleString()}`, color: 'amber' },
        { label: 'Active Projects', value: `${totalProjects} Projects`, color: 'blue' },
        { label: 'Project Margin Balance', value: `Rs. ${(projectAllocatedPKR - projectSpentPKR).toLocaleString()}`, color: 'emerald' },
        { label: 'Equipment Deployed', value: `${equipmentInUse} / ${totalEquipment} In-Use`, color: 'purple' }
      ]
    },
    {
      id: 'supervisor',
      title: 'Supervisor Desk',
      icon: 'UserCheck',
      allowedRoles: ['CEO', 'Supervisor'],
      numberCards: [
        { label: 'Staff Present Today', value: `${presentToday} / ${totalEmployees}`, color: 'emerald' },
        { label: 'Equipment Checked Out', value: `${equipmentInUse}`, color: 'purple' },
        { label: 'Pending Approvals', value: '1 Leave, 0 Checkouts', color: 'amber' }
      ]
    },
    {
      id: 'operations',
      title: 'Logistics & Facilities',
      icon: 'Boxes',
      allowedRoles: ['CEO', 'Logistics Admin'],
      numberCards: [
        { label: 'Kitchen & Canteen Spend', value: `Rs. ${totalKitchenPKR.toLocaleString()}`, color: 'amber' },
        { label: 'Utility Invoices', value: `Rs. ${totalUtilitiesPKR.toLocaleString()}`, color: 'blue' },
        { label: 'Inventory Items', value: `${erpStore.tables.tab_item.length} Parts`, color: 'emerald' }
      ]
    },
    {
      id: 'my_space',
      title: 'My Workspace',
      icon: 'User',
      allowedRoles: ['CEO', 'Supervisor', 'Logistics Admin', 'Employee'],
      numberCards: [
        { label: 'My Status Today', value: 'Active on Duty', color: 'emerald' },
        { label: 'My Assigned Tools', value: '1 Tool in Custody', color: 'blue' },
        { label: 'My Annual Leave Balance', value: '11 Days Remaining', color: 'purple' }
      ]
    }
  ];

  const filteredWorkspaces = allWorkspaces.filter(ws => ws.allowedRoles.includes(role));

  // Find employee profile for the current user
  const myEmp = erpStore.tables.tab_employee.find(e => e.user_id === req.user?.email);

  // Attach components to tasks
  const allComponents = erpStore.tables.tab_task_component || [];
  let tasks = (erpStore.tables.tab_task || []).map(t => {
    const comps = allComponents.filter(c => c.task === t.name);
    return {
      ...t,
      components: comps,
      totalComponents: comps.length,
      completedComponents: comps.filter(c => c.is_completed === 1).length
    };
  });

  // Filter tasks based on role
  if (role === 'Employee') {
    tasks = tasks.filter((t: any) => 
      t.assigned_to === myEmp?.name || 
      t.assigned_to_name === myEmp?.employee_name || 
      t.assigned_to?.toLowerCase() === req.user?.username.toLowerCase()
    );
  }

  // Project Phases for Gantt Timeline
  const phases = erpStore.tables.tab_project_phase || [];

  // Team Workload Allocation Meters (No Heatmap - Capacity Stack Approach)
  const teamWorkload = [
    {
      empId: 'HR-EMP-0002',
      fullName: 'Usman (Hardware Lead)',
      designation: 'Lead Hardware Architect',
      totalAllocationPercent: 85,
      status: 'Optimal Load',
      statusColor: 'emerald',
      benchLocation: 'RF Testing Lab - Bench A',
      activeTasksCount: 3,
      headroomPercent: 15,
      projectAllocations: [
        { project: 'Radar DSP Core', percent: 45, color: '#3b82f6' },
        { project: 'Telemetry ECU', percent: 30, color: '#8b5cf6' },
        { project: 'Lab Calibration Support', percent: 10, color: '#10b981' }
      ],
      currentMilestone: 'DDR3 length-matching & high-speed differential signal closure'
    },
    {
      empId: 'HR-EMP-0004',
      fullName: 'Zainab (Firmware Engineer)',
      designation: 'Embedded Firmware Specialist',
      totalAllocationPercent: 75,
      status: 'Optimal Load',
      statusColor: 'emerald',
      benchLocation: 'Embedded Hardware Bay',
      activeTasksCount: 2,
      headroomPercent: 25,
      projectAllocations: [
        { project: 'Telemetry ECU', percent: 50, color: '#8b5cf6' },
        { project: 'Radar DSP Core', percent: 25, color: '#3b82f6' }
      ],
      currentMilestone: 'Dual-bank flash failover state machine & CRC32 integrity'
    },
    {
      empId: 'HR-EMP-0003',
      fullName: 'Bilal (Logistics Manager)',
      designation: 'Logistics & Warehouse Officer',
      totalAllocationPercent: 90,
      status: 'Heavy Load',
      statusColor: 'amber',
      benchLocation: 'Warehouse & Receiving Bay',
      activeTasksCount: 3,
      headroomPercent: 10,
      projectAllocations: [
        { project: 'Supply Chain & Inward GRN', percent: 50, color: '#ec4899' },
        { project: 'Facility & Utilities', percent: 40, color: '#f59e0b' }
      ],
      currentMilestone: 'Traceable ISO/IEC 17025 metrology calibration certificate return'
    }
  ];

  // Inventory Safety Stock & Lead-Time Bullet Gauges
  const inventoryBulletGauges = [
    {
      itemCode: 'XC7A100T-2CSG324I',
      itemName: 'Xilinx Artix-7 FPGA 101K Logic Cells',
      category: 'Integrated Circuits (ICs)',
      currentStock: 18,
      criticalMin: 10,
      reorderPoint: 25,
      optimalMax: 50,
      stockUom: 'PCS',
      leadTimeWeeks: 12,
      unitRatePKR: 62000,
      status: 'Reorder Window',
      statusColor: 'amber',
      riskLevel: 'Medium Risk - 12 Wks International Freight'
    },
    {
      itemCode: 'STM32F407VGT6',
      itemName: 'ARM Cortex-M4 MCU 168MHz 1MB Flash',
      category: 'Integrated Circuits (ICs)',
      currentStock: 145,
      criticalMin: 25,
      reorderPoint: 60,
      optimalMax: 200,
      stockUom: 'PCS',
      leadTimeWeeks: 6,
      unitRatePKR: 4200,
      status: 'Healthy Stock',
      statusColor: 'emerald',
      riskLevel: 'Low Risk - Sufficient Buffer'
    },
    {
      itemCode: 'GLEN-801-007',
      itemName: 'Glenair MIL-DTL-38999 Shielded Connectors',
      category: 'Aerospace Harnessing',
      currentStock: 6,
      criticalMin: 8,
      reorderPoint: 15,
      optimalMax: 30,
      stockUom: 'SETS',
      leadTimeWeeks: 14,
      unitRatePKR: 48000,
      status: 'Critical Stockout Risk',
      statusColor: 'rose',
      riskLevel: 'High Risk - Below Safety Buffer'
    },
    {
      itemCode: 'RC0603FR-0710KL',
      itemName: 'Yageo SMD Resistor 10k Ohm 1% 0603',
      category: 'Passive Components',
      currentStock: 4500,
      criticalMin: 500,
      reorderPoint: 1500,
      optimalMax: 6000,
      stockUom: 'PCS',
      leadTimeWeeks: 2,
      unitRatePKR: 1.8,
      status: 'Healthy Stock',
      statusColor: 'emerald',
      riskLevel: 'Low Risk - Local Stock Available'
    }
  ];

  // Earned Value Management (EVM) Metrics & Monthly Curves
  const evmData = {
    projects: [
      {
        projectId: 'PRJ-2026-0001',
        projectName: 'Radar DSP High-Speed Digital Processing Core',
        budgetPKR: 18500000,
        plannedValuePKR: 14200000,
        earnedValuePKR: 13875000,
        actualCostPKR: 12850000,
        cpi: 1.08,
        spi: 0.98,
        costVariancePKR: 1025000,
        scheduleVariancePKR: -325000
      },
      {
        projectId: 'PRJ-2026-0002',
        projectName: 'Telemetry ECU & Avionics Interface Unit',
        budgetPKR: 9800000,
        plannedValuePKR: 6370000,
        earnedValuePKR: 6370000,
        actualCostPKR: 5850000,
        cpi: 1.09,
        spi: 1.00,
        costVariancePKR: 520000,
        scheduleVariancePKR: 0
      }
    ],
    monthlyCurves: [
      { month: 'Jun', plannedValue: 4200000, earnedValue: 4100000, actualCost: 3900000 },
      { month: 'Jul', plannedValue: 8500000, earnedValue: 8200000, actualCost: 7700000 },
      { month: 'Aug', plannedValue: 12800000, earnedValue: 12400000, actualCost: 11600000 },
      { month: 'Sep', plannedValue: 16900000, earnedValue: 16500000, actualCost: 15400000 },
      { month: 'Oct (Current)', plannedValue: 20570000, earnedValue: 20245000, actualCost: 18700000 }
    ]
  };

  // Equipment Stats (for CEO Pie Charts)
  const assets = erpStore.tables.tab_asset || [];
  const statusCounts: Record<string, number> = {};
  const categoryMap: Record<string, { count: number; value: number }> = {};

  assets.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    if (!categoryMap[a.asset_category]) {
      categoryMap[a.asset_category] = { count: 0, value: 0 };
    }
    categoryMap[a.asset_category].count += 1;
    categoryMap[a.asset_category].value += Number(a.gross_purchase_amount_pkr || 0);
  });

  const equipmentByStatus = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status],
    color: status === 'In-Use' ? '#3b82f6' : status === 'Available' ? '#10b981' : '#f59e0b'
  }));

  const equipmentByCategory = Object.keys(categoryMap).map((cat, idx) => {
    const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
    return {
      name: cat,
      count: categoryMap[cat].count,
      value_pkr: categoryMap[cat].value,
      color: colors[idx % colors.length]
    };
  });

  // Expense Trends (Monthly, Quarterly, Annual for CEO)
  const expenseTrends = role === 'CEO' ? {
    monthly: [
      { period: 'Jan', utilities: 310000, kitchen: 9500, operations: 72000, total: 391500 },
      { period: 'Feb', utilities: 325000, kitchen: 10200, operations: 80000, total: 415200 },
      { period: 'Mar', utilities: 340000, kitchen: 9800, operations: 95000, total: 444800 },
      { period: 'Apr', utilities: 360000, kitchen: 11000, operations: 88000, total: 459000 },
      { period: 'May', utilities: 390000, kitchen: 11500, operations: 105000, total: 506500 },
      { period: 'Jun', utilities: 410000, kitchen: 12000, operations: 120000, total: 542000 },
      { period: 'Jul', utilities: 430000, kitchen: 10800, operations: 115000, total: 555800 },
      { period: 'Aug', utilities: 445000, kitchen: 11200, operations: 130000, total: 586200 },
      { period: 'Sep', utilities: 435000, kitchen: 10500, operations: 145000, total: 590500 },
      { period: 'Oct', utilities: totalUtilitiesPKR, kitchen: totalKitchenPKR, operations: totalExpensesPKR, total: totalMonthlyBurnPKR }
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
  } : null;

  // Attendance Calendar for the Employee (October 2026)
  const currentDay = 21; // Today is Oct 21, 2026
  const calendarDays = [];
  const daysInMonth = 31;
  const dayNames = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];

  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeekIndex = (day - 1) % 7;
    const dayName = dayNames[dayOfWeekIndex];
    const isWeekend = dayName === 'Sat' || dayName === 'Sun';

    let status: 'Present' | 'Absent' | 'Leave' | 'Weekend' | 'Future' = 'Future';
    let checkIn: string | null = null;
    let checkOut: string | null = null;
    let hours = 0;
    let note = '';

    if (day > currentDay) {
      status = 'Future';
    } else if (isWeekend) {
      status = 'Weekend';
    } else if (day === 9) {
      status = 'Absent';
      note = 'Unexcused Absence (Flagged)';
      absentCount++;
    } else if (day === 15) {
      status = 'Leave';
      note = 'Half-Day Medical Leave (Approved)';
      checkIn = '08:45 AM';
      checkOut = '01:15 PM';
      hours = 4.5;
      leaveCount++;
    } else {
      status = 'Present';
      checkIn = '08:48 AM';
      checkOut = day === currentDay ? 'In Progress' : '05:15 PM';
      hours = 8.5;
      presentCount++;
    }

    calendarDays.push({
      day,
      date: `2026-10-${day.toString().padStart(2, '0')}`,
      dayName,
      status,
      checkIn,
      checkOut,
      hours,
      note
    });
  }

  // Return processed employees list
  const rawEmployees = erpStore.tables.tab_employee || [];
  const allEmployees = rawEmployees.map((emp: any) => ({
    ...emp,
    salary_pkr: role === 'CEO' ? emp.salary_pkr : undefined,
    cnic: role === 'CEO' ? emp.cnic : undefined
  }));

  // Equipment requests
  const rawRequests = erpStore.tables.tab_asset_request || [];
  const assetRequests = role === 'Employee'
    ? rawRequests.filter((r: any) => r.requested_by === myEmp?.name || r.owner === req.user?.email)
    : rawRequests;

  // Expenses ledger for EVM detail view (CEO only)
  const expensesLedger = role === 'CEO' ? {
    utilityBills: erpStore.tables.tab_utility_bill || [],
    kitchenExpenses: erpStore.tables.tab_kitchen_expense || [],
    expenseClaims: erpStore.tables.tab_expense_claim || []
  } : null;

  res.json({
    success: true,
    user: req.user,
    workspaces: filteredWorkspaces,
    tasks,
    allEmployees,
    assetRequests,
    allAssets: assets,
    projectPhases: phases,
    teamWorkload,
    inventoryBulletGauges,
    evmData: role === 'CEO' ? evmData : null,
    expensesLedger,
    equipmentStats: {
      byStatus: equipmentByStatus,
      byCategory: equipmentByCategory,
      totalAssets: assets.length
    },
    expenseTrends,
    attendanceCalendar: {
      month: 'October 2026',
      totalDays: daysInMonth,
      presentCount,
      absentCount,
      leaveCount,
      workingDays: presentCount + absentCount + leaveCount,
      days: calendarDays
    },
    financialSummary: role === 'CEO' ? {
      totalBurnPKR: totalMonthlyBurnPKR,
      utilitiesPKR: totalUtilitiesPKR,
      kitchenPKR: totalKitchenPKR,
      expensesPKR: totalExpensesPKR,
      projectAllocatedPKR,
      projectSpentPKR,
      projectBalancePKR: projectAllocatedPKR - projectSpentPKR
    } : null
  });
});
