import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticate, hasRole, sanitizeDoc, UserSession } from '../middleware/auth';
import { erpStore } from '../services/store';

export const doctypeRouter = Router();

doctypeRouter.use(authenticate);

/**
 * Check if the user's role is allowed to view the given table
 */
function canReadTable(tableName: string, role: string): boolean {
  // General employees and supervisors are blocked from company financial & accounting tables
  if (tableName === 'tab_utility_bill' || tableName === 'tab_kitchen_expense' || tableName === 'tab_expense_claim') {
    return role === 'CEO' || role === 'Logistics Admin';
  }
  return true;
}

/**
 * Check if the user's role is allowed to create records in the given table
 */
function canCreateTable(tableName: string, role: string): { allowed: boolean; message?: string } {
  // Only CEO (Managing Director) has authority to create Employee records
  if (tableName === 'tab_employee') {
    if (role !== 'CEO') {
      return { allowed: false, message: 'Access denied: Only CEO / Executive Directorate may create employee master records.' };
    }
  }

  // Utility bills and kitchen operational expenses can only be created by Logistics Admin or CEO
  if (tableName === 'tab_utility_bill' || tableName === 'tab_kitchen_expense') {
    if (role !== 'CEO' && role !== 'Logistics Admin') {
      return { allowed: false, message: 'Access denied: Financial and utility records can only be created by Logistics Admin or CEO.' };
    }
  }

  // Top-level defense projects can only be registered by CEO or Supervisor
  if (tableName === 'tab_project') {
    if (role !== 'CEO' && role !== 'Supervisor') {
      return { allowed: false, message: 'Access denied: Classified project creation requires Supervisory or CEO clearance.' };
    }
  }

  // Top-level engineering tasks can only be assigned by Supervisor or CEO
  if (tableName === 'tab_task') {
    if (role !== 'CEO' && role !== 'Supervisor') {
      return { allowed: false, message: 'Access denied: Task assignment and WBS generation requires Supervisory or CEO clearance.' };
    }
  }

  // Capital equipment and component stock can only be added by Logistics Admin or CEO
  if (tableName === 'tab_asset' || tableName === 'tab_item') {
    if (role !== 'CEO' && role !== 'Logistics Admin') {
      return { allowed: false, message: 'Access denied: Equipment and inventory additions require Logistics Admin or CEO clearance.' };
    }
  }

  return { allowed: true };
}

/**
 * Check if the user is allowed to modify the given document
 */
function canModifyDoc(
  tableName: string,
  doc: any,
  user: UserSession,
  updates: any
): { allowed: boolean; message?: string } {
  // Submitted documents are locked under defense/ISO audit rules
  if (doc.docstatus === 1) {
    return { allowed: false, message: 'Document is submitted and locked. Direct modifications are prohibited under audit regulations.' };
  }

  // Employee Master Modifications
  if (tableName === 'tab_employee') {
    // Check for restricted compensation and national identity fields
    const restrictedFields = ['salary_pkr', 'cnic', 'security_clearance', 'role'];
    const touchesRestricted = restrictedFields.some(field => updates[field] !== undefined);

    if (touchesRestricted && user.role !== 'CEO') {
      return {
        allowed: false,
        message: 'Access denied: Modifying confidential executive HR fields (salary, CNIC, clearance, role) requires CEO clearance.'
      };
    }

    // General employees cannot edit another employee's master record
    if (user.role === 'Employee') {
      const myEmp = erpStore.tables.tab_employee?.find(e => e.user_id === user.email);
      if (doc.name !== myEmp?.name && doc.user_id !== user.email) {
        return { allowed: false, message: 'Access denied: You may only edit your own personal profile contact information.' };
      }
    }
  }

  // Financial registers: Utility bills, kitchen expenses, expense claims
  if (tableName === 'tab_utility_bill' || tableName === 'tab_kitchen_expense' || tableName === 'tab_expense_claim') {
    if (user.role !== 'CEO' && user.role !== 'Logistics Admin') {
      return { allowed: false, message: 'Access denied: Only Logistics Admin or CEO may modify financial records.' };
    }
  }

  // Projects and Tasks
  if (tableName === 'tab_project' || tableName === 'tab_task') {
    if (user.role !== 'CEO' && user.role !== 'Supervisor') {
      return { allowed: false, message: 'Access denied: Modifying project or task deliverables requires Supervisory or CEO clearance.' };
    }
  }

  // Capital Assets and Inventory Items
  if (tableName === 'tab_asset' || tableName === 'tab_item') {
    if (user.role !== 'CEO' && user.role !== 'Logistics Admin') {
      return { allowed: false, message: 'Access denied: Modifying equipment or inventory records requires Logistics Admin or CEO clearance.' };
    }
  }

  return { allowed: true };
}

// =========================================================================
// 1. LIST RECORDS OF A DOCTYPE
// =========================================================================
doctypeRouter.get('/:doctype', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;

  const table = erpStore.tables[tableName];
  if (!table) {
    res.status(404).json({ success: false, message: `DocType '${doctype}' not found.` });
    return;
  }

  const role = req.user?.role || 'Employee';

  // Table-level access authorization check
  if (!canReadTable(tableName, role)) {
    res.status(403).json({ success: false, message: 'Confidentiality restriction: Access denied.' });
    return;
  }

  let records = [...table];

  // Role-based record and field filtering
  if (role === 'Employee') {
    const myEmp = erpStore.tables.tab_employee?.find(e => e.user_id === req.user?.email);

    if (tableName === 'tab_attendance') {
      if (myEmp) {
        records = records.filter(r => r.employee === myEmp.name || r.employee === myEmp.employee_name);
      }
    } else if (tableName === 'tab_leave_application') {
      if (myEmp) {
        records = records.filter(r => r.employee === myEmp.name);
      }
    } else if (tableName === 'tab_asset_request') {
      if (myEmp) {
        records = records.filter(r => r.requested_by === myEmp.name || r.owner === req.user?.email);
      }
    }
  }

  // Centralized field-level sanitization (strips salary, CNIC, password hashes for non-CEO)
  records = records.map(r => sanitizeDoc(r, tableName, role));

  res.json({
    success: true,
    doctype,
    count: records.length,
    data: records
  });
});

// =========================================================================
// 2. GET SINGLE DOCUMENT BY ID (PROTECTED AGAINST IDOR & CONFIDENTIAL LEAKS)
// =========================================================================
doctypeRouter.get('/:doctype/:id', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const id = String(req.params.id);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;

  const role = req.user?.role || 'Employee';

  // Table-level access check (BUG-SEC-05 fix)
  if (!canReadTable(tableName, role)) {
    res.status(403).json({ success: false, message: 'Confidentiality restriction: Access denied.' });
    return;
  }

  const table = erpStore.tables[tableName];
  if (!table) {
    res.status(404).json({ success: false, message: `DocType '${doctype}' not found.` });
    return;
  }

  const doc = table.find((d: any) => d.name === id);
  if (!doc) {
    res.status(404).json({ success: false, message: `Document '${id}' not found.` });
    return;
  }

  // Record-level access restriction for general employees
  if (role === 'Employee') {
    const myEmp = erpStore.tables.tab_employee?.find(e => e.user_id === req.user?.email);

    if (tableName === 'tab_attendance' && myEmp && doc.employee !== myEmp.name && doc.employee !== myEmp.employee_name) {
      res.status(403).json({ success: false, message: 'Access denied: You may only view your own attendance records.' });
      return;
    }

    if (tableName === 'tab_leave_application' && myEmp && doc.employee !== myEmp.name) {
      res.status(403).json({ success: false, message: 'Access denied: You may only view your own leave applications.' });
      return;
    }

    if (tableName === 'tab_asset_request' && myEmp && doc.requested_by !== myEmp.name && doc.owner !== req.user?.email) {
      res.status(403).json({ success: false, message: 'Access denied: You may only view your own equipment requests.' });
      return;
    }
  }

  // Field-level sanitization: Redacts salary_pkr, cnic, password_hash for non-CEO (BUG-SEC-01 fix)
  const sanitized = sanitizeDoc(doc, tableName, role);

  res.json({
    success: true,
    doc: sanitized
  });
});

// =========================================================================
// 3. CREATE NEW DOCUMENT WITH NAMING SERIES (PROTECTED AGAINST PRIVILEGE ESCALATION)
// =========================================================================
doctypeRouter.post('/:doctype', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;
  const role = req.user?.role || 'Employee';

  // DocType Creation RBAC check (BUG-SEC-02 & BUG-SEC-06 fix)
  const creationCheck = canCreateTable(tableName, role);
  if (!creationCheck.allowed) {
    res.status(403).json({ success: false, message: creationCheck.message });
    return;
  }

  const table = erpStore.tables[tableName];
  if (!table) {
    res.status(404).json({ success: false, message: `DocType '${doctype}' not found.` });
    return;
  }

  // Determine series prefix
  let prefix = 'DOC-';
  if (tableName === 'tab_employee') prefix = 'HR-EMP-';
  else if (tableName === 'tab_asset') prefix = 'ASSET-';
  else if (tableName === 'tab_item') prefix = 'ITEM-';
  else if (tableName === 'tab_project') prefix = 'PRJ-2026-';
  else if (tableName === 'tab_attendance') prefix = 'ATT-2026-';
  else if (tableName === 'tab_leave_application') prefix = 'LV-2026-';
  else if (tableName === 'tab_asset_repair') prefix = 'REP-2026-';
  else if (tableName === 'tab_utility_bill') prefix = 'UTIL-2026-';
  else if (tableName === 'tab_kitchen_expense') prefix = 'KIT-2026-';
  else if (tableName === 'tab_expense_claim') prefix = 'EXP-2026-';
  else if (tableName === 'tab_task') prefix = 'TASK-2026-';
  else if (tableName === 'tab_asset_request') prefix = 'REQ-2026-';

  const name = erpStore.getNextSeries(prefix);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const { phases, ...bodyData } = req.body;

  // Enforce identity binding on employee requests to prevent impersonation
  if (tableName === 'tab_asset_request' && role === 'Employee') {
    const myEmp = erpStore.tables.tab_employee?.find(e => e.user_id === req.user?.email);
    bodyData.requested_by = myEmp?.name || bodyData.requested_by;
    bodyData.requested_by_name = myEmp?.employee_name || req.user?.fullName;
  }

  const newDoc = {
    name,
    creation: now,
    modified: now,
    modified_by: req.user?.email || 'Administrator',
    owner: req.user?.email || 'Administrator',
    docstatus: 0, // Draft by default
    ...(tableName === 'tab_asset_request' ? { status: 'Pending' } : {}),
    ...bodyData
  };

  table.unshift(newDoc);

  // If task with custom phases / components was created, automatically create child components
  if (tableName === 'tab_task' && Array.isArray(phases) && phases.length > 0) {
    phases.forEach((phaseTitle: string) => {
      const compName = erpStore.getNextSeries('COMP-2026-');
      erpStore.tables.tab_task_component.push({
        name: compName,
        task: name,
        component_title: phaseTitle,
        is_completed: 0,
        completed_at: null,
        notes: '',
        days_open: 1
      });
    });
  }

  res.status(201).json({
    success: true,
    message: `${doctype} ${name} created.`,
    doc: sanitizeDoc(newDoc, tableName, role)
  });
});

// =========================================================================
// 4. APPROVE EQUIPMENT REQUEST (PROTECTED AGAINST UNAUTHORIZED / SELF-APPROVAL)
// =========================================================================
doctypeRouter.post('/tab_asset_request/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const role = req.user?.role || 'Employee';

  // Authorization Check: Only Supervisor or CEO can approve (BUG-SEC-04 fix)
  if (!hasRole(req.user, 'Supervisor', 'CEO')) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Equipment checkout approvals require Supervisor or CEO clearance.'
    });
    return;
  }

  const id = String(req.params.id);
  const request = erpStore.tables.tab_asset_request?.find((r: any) => r.name === id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found.' });
    return;
  }

  // Anti-Self-Approval Check: An employee must never approve their own request
  const myEmp = erpStore.tables.tab_employee?.find(e => e.user_id === req.user?.email);
  if (
    request.owner === req.user?.email ||
    (myEmp && request.requested_by === myEmp.name) ||
    request.requested_by?.toLowerCase() === req.user?.username.toLowerCase()
  ) {
    res.status(403).json({
      success: false,
      message: 'Security restriction: Self-approval of equipment checkout requests is strictly prohibited.'
    });
    return;
  }

  const asset = erpStore.tables.tab_asset?.find((a: any) => a.name === request.asset);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Target asset not found.' });
    return;
  }

  if (asset.status !== 'Available') {
    res.status(400).json({
      success: false,
      message: `Equipment is currently ${asset.status} (In custody of ${asset.custodian_name || 'another lead'}). Cannot approve.`
    });
    return;
  }

  request.status = 'Approved';
  request.approved_by = req.user?.fullName || 'Supervisor';
  request.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Update asset custody & status
  asset.status = 'In-Use';
  asset.custodian_employee = request.requested_by;
  asset.custodian_name = request.requested_by_name;
  asset.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);

  res.json({
    success: true,
    message: `Equipment ${asset.name} (${asset.asset_name}) checked out to ${request.requested_by_name}.`,
    request,
    asset
  });
});

// =========================================================================
// 5. REJECT EQUIPMENT REQUEST (PROTECTED)
// =========================================================================
doctypeRouter.post('/tab_asset_request/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  // Authorization Check: Only Supervisor or CEO can reject
  if (!hasRole(req.user, 'Supervisor', 'CEO')) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Equipment rejections require Supervisor or CEO clearance.'
    });
    return;
  }

  const id = String(req.params.id);
  const { reason } = req.body;
  const request = erpStore.tables.tab_asset_request?.find((r: any) => r.name === id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found.' });
    return;
  }

  request.status = 'Rejected';
  request.rejection_reason = reason || 'Prohibited by supervisor due to scheduled calibration / higher priority task.';
  request.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);

  res.json({
    success: true,
    message: `Equipment request ${id} rejected.`,
    request
  });
});

// =========================================================================
// 6. RETURN EQUIPMENT TO STORE (PROTECTED)
// =========================================================================
doctypeRouter.post('/tab_asset/:id/return', (req: AuthenticatedRequest, res: Response) => {
  // Authorization Check: Logistics Admin, Supervisor, or CEO
  if (!hasRole(req.user, 'Logistics Admin', 'Supervisor', 'CEO')) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Equipment returns to inventory require Logistics Admin or Supervisory clearance.'
    });
    return;
  }

  const id = String(req.params.id);
  const asset = erpStore.tables.tab_asset?.find((a: any) => a.name === id);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  asset.status = 'Available';
  asset.custodian_employee = null;
  asset.custodian_name = null;
  asset.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);

  res.json({
    success: true,
    message: `Equipment ${asset.asset_name} returned to Store. Status set to Available.`,
    asset
  });
});

// =========================================================================
// 7. UPDATE EQUIPMENT STATUS (PROTECTED)
// =========================================================================
doctypeRouter.post('/tab_asset/:id/status', (req: AuthenticatedRequest, res: Response) => {
  // Authorization Check: Logistics Admin, Supervisor, or CEO
  if (!hasRole(req.user, 'Logistics Admin', 'Supervisor', 'CEO')) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Modifying equipment operational status requires Logistics Admin or Supervisory clearance.'
    });
    return;
  }

  const id = String(req.params.id);
  const { status } = req.body;
  const asset = erpStore.tables.tab_asset?.find((a: any) => a.name === id);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  asset.status = status;
  if (status === 'Available') {
    asset.custodian_employee = null;
    asset.custodian_name = null;
  }
  asset.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);

  res.json({
    success: true,
    message: `Asset ${asset.name} status updated to ${status}.`,
    asset
  });
});

// =========================================================================
// 8. UPDATE / PATCH DOCUMENT (PROTECTED AGAINST UNAUTHORIZED FIELD MUTATIONS)
// =========================================================================
doctypeRouter.patch('/:doctype/:id', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const id = String(req.params.id);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;
  const table = erpStore.tables[tableName];

  if (!table) {
    res.status(404).json({ success: false, message: `DocType '${doctype}' not found.` });
    return;
  }

  const doc = table.find((d: any) => d.name === id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  // RBAC & Field-Level Modification Verification (BUG-SEC-03 fix)
  const modificationCheck = canModifyDoc(tableName, doc, req.user!, req.body);
  if (!modificationCheck.allowed) {
    res.status(403).json({ success: false, message: modificationCheck.message });
    return;
  }

  Object.assign(doc, req.body, {
    modified: new Date().toISOString().replace('T', ' ').substring(0, 19),
    modified_by: req.user?.email || 'Administrator'
  });

  res.json({
    success: true,
    message: `${id} updated successfully.`,
    doc: sanitizeDoc(doc, tableName, req.user?.role || 'Employee')
  });
});

// =========================================================================
// 9. SUBMIT DOCUMENT (docstatus = 1) (PROTECTED)
// =========================================================================
doctypeRouter.post('/:doctype/:id/submit', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const id = String(req.params.id);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;
  const table = erpStore.tables[tableName];
  const role = req.user?.role || 'Employee';

  if (!table) {
    res.status(404).json({ success: false, message: `DocType '${doctype}' not found.` });
    return;
  }

  const doc = table.find((d: any) => d.name === id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  // Restrict document submission authorization
  if (['tab_utility_bill', 'tab_kitchen_expense', 'tab_expense_claim'].includes(tableName) && !hasRole(req.user, 'CEO', 'Logistics Admin')) {
    res.status(403).json({ success: false, message: 'Access denied: Only Logistics Admin or CEO may submit financial invoices.' });
    return;
  }

  if (tableName === 'tab_employee' && role !== 'CEO') {
    res.status(403).json({ success: false, message: 'Access denied: Only CEO may submit and lock employee records.' });
    return;
  }

  doc.docstatus = 1;
  doc.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);
  doc.modified_by = req.user?.email || 'Administrator';

  res.json({
    success: true,
    message: `${id} submitted and locked.`,
    doc: sanitizeDoc(doc, tableName, role)
  });
});

// =========================================================================
// 10. TOGGLE TASK COMPONENT COMPLETION
// =========================================================================
doctypeRouter.post('/tab_task_component/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const component = erpStore.tables.tab_task_component?.find((c: any) => c.name === id);

  if (!component) {
    res.status(404).json({ success: false, message: 'Component not found.' });
    return;
  }

  // Toggle completion
  component.is_completed = component.is_completed === 1 ? 0 : 1;
  component.completed_at = component.is_completed === 1 
    ? new Date().toISOString().replace('T', ' ').substring(0, 19)
    : null;

  // Recalculate parent task progress
  const parentTask = erpStore.tables.tab_task?.find((t: any) => t.name === component.task);
  if (parentTask) {
    const allComps = erpStore.tables.tab_task_component.filter((c: any) => c.task === parentTask.name);
    const completedCount = allComps.filter((c: any) => c.is_completed === 1).length;
    parentTask.progress = Math.round((completedCount / allComps.length) * 100);
    parentTask.status = parentTask.progress === 100 ? 'Completed' : parentTask.progress > 0 ? 'Working' : 'Open';
    parentTask.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  res.json({
    success: true,
    message: `Component ${id} marked as ${component.is_completed === 1 ? 'Completed' : 'Pending'}.`,
    component,
    task: parentTask
  });
});

// =========================================================================
// 11. SAVE ENGINEERING NOTE / BLOCKER ON TASK COMPONENT
// =========================================================================
doctypeRouter.post('/tab_task_component/:id/note', (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const { notes } = req.body;
  const component = erpStore.tables.tab_task_component?.find((c: any) => c.name === id);

  if (!component) {
    res.status(404).json({ success: false, message: 'Component not found.' });
    return;
  }

  component.notes = String(notes || '').trim();

  res.json({
    success: true,
    message: `Engineering note recorded for ${id}.`,
    component
  });
});
