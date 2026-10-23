import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { erpStore } from '../services/store';

export const doctypeRouter = Router();

doctypeRouter.use(authenticate);

// List records of a DocType
doctypeRouter.get('/:doctype', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;

  const table = erpStore.tables[tableName];
  if (!table) {
    res.status(404).json({ success: false, message: `DocType '${doctype}' not found.` });
    return;
  }

  const role = req.user?.role || 'Employee';

  // Confidentiality filtering
  let records = [...table];

  // If Employee, restrict certain tables
  if (role === 'Employee') {
    if (tableName === 'tab_employee') {
      // Employees only see their own profile or public staff list without salary
      records = records.map(r => ({
        ...r,
        salary_pkr: undefined,
        cnic: undefined
      }));
    } else if (tableName === 'tab_attendance') {
      // Employees only see their own attendance
      const myEmp = erpStore.tables.tab_employee.find(e => e.user_id === req.user?.email);
      if (myEmp) {
        records = records.filter(r => r.employee === myEmp.name);
      }
    } else if (tableName === 'tab_leave_application') {
      const myEmp = erpStore.tables.tab_employee.find(e => e.user_id === req.user?.email);
      if (myEmp) {
        records = records.filter(r => r.employee === myEmp.name);
      }
    } else if (tableName === 'tab_expense_claim' || tableName === 'tab_utility_bill' || tableName === 'tab_kitchen_expense') {
      // General employees have no access to company accounting tables
      res.status(403).json({ success: false, message: 'Confidentiality restriction: Access denied.' });
      return;
    }
  }

  res.json({
    success: true,
    doctype,
    count: records.length,
    data: records
  });
});

// Get single document by ID
doctypeRouter.get('/:doctype/:id', (req: AuthenticatedRequest, res: Response) => {
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
    res.status(404).json({ success: false, message: `Document '${id}' not found.` });
    return;
  }

  res.json({
    success: true,
    doc
  });
});

// Create new document with naming series
doctypeRouter.post('/:doctype', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;

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
    doc: newDoc
  });
});

// Approve Equipment Request
doctypeRouter.post('/tab_asset_request/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const request = erpStore.tables.tab_asset_request?.find((r: any) => r.name === id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found.' });
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

// Reject Equipment Request
doctypeRouter.post('/tab_asset_request/:id/reject', (req: AuthenticatedRequest, res: Response) => {
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

// Return Equipment to Store
doctypeRouter.post('/tab_asset/:id/return', (req: AuthenticatedRequest, res: Response) => {
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

// Update Equipment Status (Available / In-Use / Under Maintenance / Calibration)
doctypeRouter.post('/tab_asset/:id/status', (req: AuthenticatedRequest, res: Response) => {
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

// Update / Patch Document
doctypeRouter.patch('/:doctype/:id', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const id = String(req.params.id);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;
  const table = erpStore.tables[tableName];

  const doc = table?.find((d: any) => d.name === id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  Object.assign(doc, req.body, {
    modified: new Date().toISOString().replace('T', ' ').substring(0, 19),
    modified_by: req.user?.email || 'Administrator'
  });

  res.json({
    success: true,
    message: `${id} updated successfully.`,
    doc
  });
});

// Submit Document (docstatus = 1)
doctypeRouter.post('/:doctype/:id/submit', (req: AuthenticatedRequest, res: Response) => {
  const doctype = String(req.params.doctype);
  const id = String(req.params.id);
  const tableName = doctype.startsWith('tab_') ? doctype : `tab_${doctype.toLowerCase()}`;
  const table = erpStore.tables[tableName];

  const doc = table?.find((d: any) => d.name === id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  doc.docstatus = 1;
  doc.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);
  doc.modified_by = req.user?.email || 'Administrator';

  res.json({
    success: true,
    message: `${id} submitted and locked.`,
    doc
  });
});

// Toggle Task Component completion & recalculate task progress
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

// Save Engineering Note / Blocker on Task Component
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
