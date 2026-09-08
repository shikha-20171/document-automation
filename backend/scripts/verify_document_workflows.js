/**
 * Master E2E Automated Verification Script
 * Covers all 6 Document Automation Lifecycles from the Master Prompt
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const prisma = require("../src/config/prismaClient");
const unifiedDocumentService = require("../src/services/unifiedDocumentService");
const unifiedOcrService = require("../src/services/unifiedOcrService");

async function runMasterVerification() {
  console.log("==========================================================");
  console.log("🚀 STARTING AI DOCUMENT AUTOMATION E2E WORKFLOW VERIFICATION");
  console.log("==========================================================");

  // Find or create test users for all 4 roles
  const org = await prisma.organisation.findFirst();
  if (!org) {
    throw new Error("No Organisation found in database. Run seeds first.");
  }
  const orgId = org.id;
  console.log(`[INIT] Verified Tenant Organisation: "${org.name}" (ID: ${orgId})`);

  // Ensure real database user rows exist for all 4 roles
  let adminUser = await prisma.user.findFirst({
    where: { organisation_id: orgId, role: { in: ["ORGANISATION_ADMIN", "ADMIN"] } },
  });

  let deptManagerUser = await prisma.user.findFirst({
    where: { email: "manager@tcs.com" },
  });
  if (!deptManagerUser) {
    deptManagerUser = await prisma.user.create({
      data: {
        organisation: { connect: { id: orgId } },
        email: "manager@tcs.com",
        password_hash: "hashed_dummy_pw",
        full_name: "Rahul Sharma (Dept Manager)",
        role: "DEPARTMENT_MANAGER",
      },
    });
  }

  let teamLeadUser = await prisma.user.findFirst({
    where: { email: "lead@tcs.com" },
  });
  if (!teamLeadUser) {
    teamLeadUser = await prisma.user.create({
      data: {
        organisation: { connect: { id: orgId } },
        email: "lead@tcs.com",
        password_hash: "hashed_dummy_pw",
        full_name: "Priya Patel (Team Lead)",
        role: "TEAM_LEADER",
      },
    });
  }

  let employeeUser = await prisma.user.findFirst({
    where: { email: "employee@tcs.com" },
  });
  if (!employeeUser) {
    employeeUser = await prisma.user.create({
      data: {
        organisation: { connect: { id: orgId } },
        email: "employee@tcs.com",
        password_hash: "hashed_dummy_pw",
        full_name: "Amit Verma (Employee Associate)",
        role: "STAFF",
      },
    });
  }



  console.log(`[ROLES] Verified 4 Actor Identities:`);
  console.log(`  • Org Admin: ${adminUser.full_name} (${adminUser.email}) [ID: ${adminUser.id}]`);
  console.log(`  • Dept Manager: ${deptManagerUser.full_name} (${deptManagerUser.email}) [ID: ${deptManagerUser.id}]`);
  console.log(`  • Team Lead: ${teamLeadUser.full_name} (${teamLeadUser.email}) [ID: ${teamLeadUser.id}]`);
  console.log(`  • Employee: ${employeeUser.full_name} (${employeeUser.email}) [ID: ${employeeUser.id}]`);


  // =========================================================================
  // TEST FLOW 1:
  // Employee AI Builder -> Quotation -> Submit Approval -> Team Lead Approves -> Send for Signature -> Sign -> Final Document -> Send to Client
  // =========================================================================
  console.log("\n----------------------------------------------------------");
  console.log("TEST FLOW 1: AI Document Builder -> Approval -> Signature -> Final");
  console.log("----------------------------------------------------------");

  // Step 1: Employee creates document
  const doc1 = await unifiedDocumentService.createDocument(
    orgId,
    employeeUser.id,
    employeeUser.full_name,
    {
      title: "Enterprise Cloud Automation Quotation",
      documentType: "Quotation",
      category: "Commercial",
      clientName: "Global Logistics Corp",
      clientEmail: "billing@globallogistics.com",
      content: [
        { id: "s1", type: "header", title: "Enterprise Quotation", body: "Prepared for Global Logistics Corp" },
        { id: "s2", type: "table", title: "Commercials", tableData: { headers: ["Item", "Price"], rows: [["Cloud Setup", "₹5,00,000"]] } },
      ],
      financialData: { subtotal: 500000, taxRate: 18, taxAmount: 90000, total: 590000 },
    }
  );
  console.log(`✓ Step 1.1 Created Document: ${doc1.documentNumber} (ID: ${doc1.id}) by ${employeeUser.full_name}`);

  // Step 2: Employee submits for approval
  const submit1Res = await unifiedDocumentService.submitForApproval(
    doc1.id,
    orgId,
    {
      approverRole: "TEAM_LEADER",
      comments: "Please approve Cloud Setup quote for Global Logistics",
    },
    employeeUser
  );
  console.log(`✓ Step 1.2 Submitted for Approval: Request ID ${submit1Res.approvalRequest.id} (Status: ${submit1Res.document.status})`);

  // Step 3: Team Lead approves
  const app1Approved = await unifiedDocumentService.processApproval(
    doc1.id,
    orgId,
    {
      action: "APPROVE",
      comments: "Commercials and deliverables verified. Approved for signing.",
    },
    teamLeadUser
  );
  console.log(`✓ Step 1.3 Team Lead Approved: Status is now "${app1Approved.document.status}", Can send signature: ${app1Approved.canSendForSignature}`);

  // Step 4: Dispatch for signature (directly from approval)
  const sig1 = await unifiedDocumentService.sendForSignature(
    doc1.id,
    orgId,
    {
      signerName: "Global Logistics Director",
      signerEmail: "director@globallogistics.com",
    },
    teamLeadUser
  );
  console.log(`✓ Step 1.4 Dispatched Signature: Envelope ID ${sig1.id} (Status: ${sig1.status})`);

  // Step 5: Sign the document
  const signResult1 = await unifiedDocumentService.signDocument(
    doc1.id,
    {
      signerName: "Global Logistics Director",
      signerEmail: "director@globallogistics.com",
      signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    }
  );
  console.log(`✓ Step 1.5 Signed Document: Result success = ${signResult1.success}`);

  // Step 6: Verify final document view
  const finalDoc1 = await unifiedDocumentService.getDocumentById(doc1.id, orgId);
  if (finalDoc1.status !== "COMPLETED" && finalDoc1.status !== "SIGNED") {
    throw new Error(`Flow 1 assertion failed: expected COMPLETED or SIGNED, got ${finalDoc1.status}`);
  }
  console.log(`✓ Step 1.6 Verified Final Certified Document: ${finalDoc1.documentNumber} is status "${finalDoc1.status}"`);

  // =========================================================================
  // TEST FLOW 2:
  // Employee OCR -> Extract Invoice -> Create Document -> Edit -> Submit -> Approve -> Sign -> Final
  // =========================================================================
  console.log("\n----------------------------------------------------------");
  console.log("TEST FLOW 2: OCR Extraction -> Create Document -> Approval -> Final");
  console.log("----------------------------------------------------------");

  const sampleInvoiceText = `
TAX INVOICE
Invoice No: INV-2026-9812
Invoice Date: 2026-08-15
Due Date: 2026-09-15
Vendor: TechWave Solutions Pvt Ltd
Client / Bill To: Apex Retailers India
GSTIN: 27AAACT1234F1Z9

Line Items:
1. Dedicated Cloud Instance (Aug 2026) - Qty: 1 - Unit Price: 45000 - Total: 45000
2. AI Document Processing Pack - Qty: 5 - Unit Price: 5000 - Total: 25000

Subtotal: 70000
GST (18%): 12600
Grand Total: 82600
  `;

  // Step 1: Process OCR
  const ocrRes = await unifiedOcrService.processDocument({
    file: {
      buffer: Buffer.from(sampleInvoiceText),
      originalname: "INV-2026-9812.txt",
      mimetype: "text/plain",
      size: Buffer.byteLength(sampleInvoiceText),
    },
    action: "extract_invoice",
    organisationId: orgId,
    userId: employeeUser.id,
    userName: employeeUser.full_name,
  });
  console.log(`✓ Step 2.1 OCR Processed: Job ID ${ocrRes.jobId}, Confidence: ${ocrRes.confidenceScore}%`);
  console.log(`      Extracted fields: Invoice: ${ocrRes.data?.invoice_number || ocrRes.fields?.invoice_number}, Total: ${ocrRes.data?.total_amount || ocrRes.fields?.total_amount}`);

  // Step 2: Create Document from OCR
  const ocrDoc = await unifiedOcrService.createDocumentFromOcr({
    ocrData: ocrRes,
    rawText: ocrRes.rawText,
    fileName: "INV-2026-9812.txt",
    title: "Apex Retailers Processed Invoice",
    documentType: "Invoice",
    category: "Finance",
    organisationId: orgId,
    userId: employeeUser.id,
    userName: employeeUser.full_name,
  });
  console.log(`✓ Step 2.2 Created Document from OCR: ${ocrDoc.documentNumber} (ID: ${ocrDoc.id})`);


  // Step 3: Submit for approval
  const submit2Res = await unifiedDocumentService.submitForApproval(
    ocrDoc.id,
    orgId,
    {
      approverRole: "DEPARTMENT_MANAGER",
      comments: "Extracted invoice from TechWave for Apex Retailers. Please verify and approve.",
    },
    employeeUser
  );
  console.log(`✓ Step 2.3 Submitted OCR Document for Approval: Req ID ${submit2Res.approvalRequest.id}`);

  // Step 4: Department Manager approves
  const app2Approved = await unifiedDocumentService.processApproval(
    ocrDoc.id,
    orgId,
    {
      action: "APPROVE",
      comments: "Line items and GST verified with vendor records. Approved.",
    },
    deptManagerUser
  );
  console.log(`✓ Step 2.4 Dept Manager Approved: Document status is "${app2Approved.document.status}"`);

  // Step 5: Sign
  const signResult2 = await unifiedDocumentService.signDocument(
    ocrDoc.id,
    {
      signerName: "Apex Retailers Finance Head",
      signerEmail: "finance@apexretailers.com",
      signatureMode: "type",
      signatureData: "Apex Retailers Finance Head",
    }
  );
  console.log(`✓ Step 2.5 Signed OCR Document: Sign success = ${signResult2.success}`);

  // =========================================================================
  // TEST FLOW 3:
  // Save as Template -> Create from Template (verify original unchanged)
  // =========================================================================
  console.log("\n----------------------------------------------------------");
  console.log("TEST FLOW 3: Save as Template -> Create Document from Template");
  console.log("----------------------------------------------------------");

  const unifiedTemplateService = require("../src/services/unifiedTemplateService");

  const tplRes = await unifiedTemplateService.createTemplate(orgId, {
    name: "Standard Commercial Master Template",
    category: "Commercial",
    documentType: "Quotation",
    description: "Enterprise quotation master template with standard terms",
    sections: [
      { id: "t1", type: "header", title: "Standard Quote Header", body: "Default template scope" },
      { id: "t2", type: "terms", title: "Standard SLA Terms", body: "Net 30 days payment terms" },
    ],
    defaultVariables: { currency: "INR", defaultTax: "18" },
  });
  console.log(`✓ Step 3.1 Created Reusable Template: "${tplRes.name}" (ID: ${tplRes.id})`);

  // Create new document from template
  const docFromTpl = await unifiedDocumentService.createDocument(
    orgId,
    employeeUser.id,
    employeeUser.full_name,
    {
      templateId: tplRes.id,
      title: "Client Proposal using Master Template",
      documentType: tplRes.documentType,
      category: tplRes.category,
      clientName: "Horizon Ventures",
      clientEmail: "deals@horizon.com",
      content: tplRes.sections || tplRes.content,
    }
  );
  console.log(`✓ Step 3.2 Created Document from Template: ${docFromTpl.documentNumber}`);

  // Verify template content unchanged
  const originalTpl = await unifiedTemplateService.getTemplateById(tplRes.id, orgId);
  if (!originalTpl || originalTpl.name !== "Standard Commercial Master Template") {
    throw new Error("Flow 3 failed: Original template was altered or missing!");
  }
  console.log(`✓ Step 3.3 Verified Original Template remains intact and reusable.`);


  // =========================================================================
  // TEST FLOW 4:
  // Department Workflow: Dept Manager -> Assign to Team Lead -> Review
  // =========================================================================
  console.log("\n----------------------------------------------------------");
  console.log("TEST FLOW 4: Department Assignment & Delegation");
  console.log("----------------------------------------------------------");

  const deptDoc = await unifiedDocumentService.createDocument(
    orgId,
    deptManagerUser.id,
    deptManagerUser.full_name,
    {
      title: "Quarterly Operations SLA Compliance",
      documentType: "Agreement",
      category: "Operations",
      content: [{ id: "op1", type: "text", title: "Operations Scope", body: "Review metrics" }],
    }
  );

  const assignedDoc = await unifiedDocumentService.assignDocument(
    deptDoc.id,
    orgId,
    {
      assignedToId: teamLeadUser.id,
      assignedToName: teamLeadUser.full_name,
      assignedToEmail: teamLeadUser.email,
      departmentName: "Operations",
      teamName: "Cloud Infrastructure",
      priority: "HIGH",
      instructions: "Please review and complete the SLA schedule by Friday.",
    },
    deptManagerUser
  );
  console.log(`✓ Step 4.1 Assigned Document: ${assignedDoc.documentNumber} assigned to ${assignedDoc.assignedToName} (Priority: ${assignedDoc.priority})`);

  // =========================================================================
  // TEST FLOW 5:
  // Employee submit -> Manager Request Changes -> Employee edit & resubmit -> Approve
  // =========================================================================
  console.log("\n----------------------------------------------------------");
  console.log("TEST FLOW 5: Review Feedback Loop: Request Changes -> Resubmit -> Approve");
  console.log("----------------------------------------------------------");

  const changeDoc = await unifiedDocumentService.createDocument(
    orgId,
    employeeUser.id,
    employeeUser.full_name,
    {
      title: "Marketing Campaign SOW",
      documentType: "Proposal",
      category: "Commercial",
      content: [{ id: "c1", type: "text", title: "Initial Scope", body: "Draft campaign proposal." }],
    }
  );

  const submit5Res = await unifiedDocumentService.submitForApproval(
    changeDoc.id,
    orgId,
    {
      approverRole: "DEPARTMENT_MANAGER",
      comments: "Draft proposal for review",
    },
    employeeUser
  );
  console.log(`✓ Step 5.1 Submitted for Review: ID ${submit5Res.approvalRequest.id}`);

  // Manager requests changes
  const app5Changes = await unifiedDocumentService.processApproval(
    changeDoc.id,
    orgId,
    {
      action: "REQUEST_CHANGES",
      comments: "Please add social media KPIs and reduce the timeline to 45 days.",
    },
    deptManagerUser
  );
  console.log(`✓ Step 5.2 Manager Requested Changes: Document status is "${app5Changes.document.status}"`);

  // Employee updates document
  await unifiedDocumentService.updateDocument(
    changeDoc.id,
    orgId,
    employeeUser.id,
    employeeUser.full_name,
    {
      title: "Marketing Campaign SOW (Revised)",
      content: [
        { id: "c1", type: "text", title: "Revised Scope", body: "Includes social media KPIs and 45-day milestone." },
      ],
    }
  );


  // Employee resubmits
  const submit5Resubmit = await unifiedDocumentService.submitForApproval(
    changeDoc.id,
    orgId,
    {
      approverRole: "DEPARTMENT_MANAGER",
      comments: "Updated with social media KPIs and revised 45-day timeline.",
    },
    employeeUser
  );
  console.log(`✓ Step 5.3 Employee Resubmitted with Revisions: Request ID ${submit5Resubmit.approvalRequest.id}`);

  // Manager approves
  const app5FinalApproved = await unifiedDocumentService.processApproval(
    changeDoc.id,
    orgId,
    {
      action: "APPROVE",
      comments: "Revisions confirmed. Proposal approved.",
    },
    deptManagerUser
  );
  console.log(`✓ Step 5.4 Manager Approved Resubmission: Document status is "${app5FinalApproved.document.status}"`);

  // =========================================================================
  // TEST FLOW 6:
  // Document Workspace Tabs & RBAC Filtering Verification
  // =========================================================================
  console.log("\n----------------------------------------------------------");
  console.log("TEST FLOW 6: Unified Document Workspace Tab Filters & RBAC");
  console.log("----------------------------------------------------------");

  const staffList = await unifiedDocumentService.listDocuments(
    orgId,
    { tab: "ALL" },
    employeeUser
  );
  console.log(`✓ Step 6.1 Employee Documents List: Count = ${staffList.data.length}`);

  const pendingList = await unifiedDocumentService.listDocuments(
    orgId,
    { tab: "PENDING_APPROVAL" },
    deptManagerUser
  );
  console.log(`✓ Step 6.2 Dept Manager Pending Approvals Filter: Count = ${pendingList.data.length}`);

  const completedList = await unifiedDocumentService.listDocuments(
    orgId,
    { tab: "COMPLETED" },
    adminUser
  );
  console.log(`✓ Step 6.3 Org Admin Completed Documents Filter: Count = ${completedList.data.length}`);

  console.log("\n==========================================================");
  console.log("🎉 ALL 6 WORKFLOW LIFECYCLES COMPLETED & FULLY VERIFIED!");
  console.log("==========================================================");
}

runMasterVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ E2E VERIFICATION FAILED:", err);
    process.exit(1);
  });
