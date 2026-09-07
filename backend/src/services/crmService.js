const prisma = require("../config/prismaClient");
const TemplateMergeEngine = require("./templateMergeEngine");

class CrmService {
  // ─── DASHBOARD STATS ───────────────────────────────────────────────────────
  static async getDashboardStats(organisationId) {
    const orgId = Number(organisationId);

    const [
      totalClients,
      activeClients,
      inactiveClients,
      prospectClients,
      archivedClients,
      totalContacts,
      totalDocuments,
      totalRequests,
      pendingRequests,
      completedRequests,
      recentActivities,
      recentClients,
    ] = await Promise.all([
      prisma.crmClient.count({ where: { organisationId: orgId } }),
      prisma.crmClient.count({ where: { organisationId: orgId, status: "Active" } }),
      prisma.crmClient.count({ where: { organisationId: orgId, status: "Inactive" } }),
      prisma.crmClient.count({ where: { organisationId: orgId, status: "Prospect" } }),
      prisma.crmClient.count({ where: { organisationId: orgId, status: "Archived" } }),
      prisma.crmContact.count({ where: { organisationId: orgId } }),
      prisma.crmDocument.count({ where: { organisationId: orgId } }),
      prisma.crmRequest.count({ where: { organisationId: orgId } }),
      prisma.crmRequest.count({
        where: {
          organisationId: orgId,
          status: { in: ["New", "In Progress", "Waiting for Client", "Pending Approval"] },
        },
      }),
      prisma.crmRequest.count({ where: { organisationId: orgId, status: "Completed" } }),
      prisma.crmActivity.findMany({
        where: { organisationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { client: { select: { id: true, name: true } } },
      }),
      prisma.crmClient.findMany({
        where: { organisationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          contacts: { take: 1 },
          documents: { take: 1 },
        },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      inactiveClients,
      prospectClients,
      archivedClients,
      totalContacts,
      totalDocuments,
      totalRequests,
      pendingRequests,
      completedRequests,
      recentActivities,
      recentClients,
    };
  }

  // ─── DUPLICATE CHECK ──────────────────────────────────────────────────────
  static async checkDuplicate(organisationId, { name, email, phone, excludeId }) {
    const orgId = Number(organisationId);
    const conditions = [];

    if (name && name.trim()) {
      conditions.push({ name: { equals: name.trim(), mode: "insensitive" } });
    }
    if (email && email.trim()) {
      conditions.push({ email: { equals: email.trim(), mode: "insensitive" } });
    }
    if (phone && phone.trim()) {
      conditions.push({ phone: { equals: phone.trim() } });
    }

    if (conditions.length === 0) {
      return { isDuplicate: false };
    }

    const where = {
      organisationId: orgId,
      OR: conditions,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prisma.crmClient.findFirst({
      where,
      select: { id: true, name: true, email: true, phone: true, status: true },
    });

    if (existing) {
      return {
        isDuplicate: true,
        matchedClient: existing,
        message: `A client with matching details already exists: "${existing.name}" (${existing.id}).`,
      };
    }

    return { isDuplicate: false };
  }

  // ─── CLIENTS ─────────────────────────────────────────────────────────────
  static async getClients(organisationId, { search, status, department, industry } = {}) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (status && status !== "All") where.status = status;
    if (department && department !== "All") where.department = department;
    if (industry && industry !== "All") where.industry = industry;
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { contactPerson: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim() } },
        { id: { contains: search.trim() } },
      ];
    }

    const clients = await prisma.crmClient.findMany({
      where,
      include: {
        contacts: true,
        documents: true,
        requests: true,
        activities: { take: 5, orderBy: { createdAt: "desc" } },
        notesList: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return clients;
  }

  static async getClientById(id, organisationId) {
    const orgId = Number(organisationId);
    return await prisma.crmClient.findFirst({
      where: { id, organisationId: orgId },
      include: {
        contacts: { orderBy: { isPrimary: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        requests: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
        notesList: { orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] },
      },
    });
  }

  static async createClient(organisationId, data, userName = "Admin") {
    const orgId = Number(organisationId);
    const client = await prisma.crmClient.create({
      data: {
        organisationId: orgId,
        name: data.name,
        type: data.type || "Company",
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || "India",
        postalCode: data.postalCode,
        industry: data.industry,
        companySize: data.companySize,
        status: data.status || "Active",
        department: data.department || "General",
        assignedTo: data.assignedTo || "Account Manager",
        tags: Array.isArray(data.tags) ? data.tags : [],
        notes: data.notes,
      },
    });

    // Record activity
    await prisma.crmActivity.create({
      data: {
        clientId: client.id,
        organisationId: orgId,
        type: "Client created",
        description: `Client "${client.name}" registered in CRM database.`,
        user: userName,
      },
    });

    return client;
  }

  static async updateClient(id, organisationId, patch, userName = "Admin") {
    const orgId = Number(organisationId);
    const updated = await prisma.crmClient.update({
      where: { id, organisationId: orgId },
      data: patch,
    });

    await prisma.crmActivity.create({
      data: {
        clientId: id,
        organisationId: orgId,
        type: "Client updated",
        description: `Client "${updated.name}" information updated.`,
        user: userName,
      },
    });

    return updated;
  }

  static async archiveClient(id, organisationId, userName = "Admin") {
    const orgId = Number(organisationId);
    const client = await prisma.crmClient.update({
      where: { id, organisationId: orgId },
      data: { status: "Archived" },
    });

    await prisma.crmActivity.create({
      data: {
        clientId: id,
        organisationId: orgId,
        type: "Client updated",
        description: `Client "${client.name}" was archived. Historical documents and contacts remain safe.`,
        user: userName,
      },
    });

    return client;
  }

  static async restoreClient(id, organisationId, userName = "Admin") {
    const orgId = Number(organisationId);
    const client = await prisma.crmClient.update({
      where: { id, organisationId: orgId },
      data: { status: "Active" },
    });

    await prisma.crmActivity.create({
      data: {
        clientId: id,
        organisationId: orgId,
        type: "Client updated",
        description: `Client "${client.name}" was restored to Active status.`,
        user: userName,
      },
    });

    return client;
  }

  static async deleteClient(id, organisationId) {
    const orgId = Number(organisationId);
    // Safe check before deletion
    const docCount = await prisma.crmDocument.count({ where: { clientId: id, organisationId: orgId } });
    if (docCount > 0) {
      // Archive instead of hard-deleting to protect documents
      return await this.archiveClient(id, orgId);
    }

    return await prisma.crmClient.delete({
      where: { id, organisationId: orgId },
    });
  }

  // ─── CONTACTS ────────────────────────────────────────────────────────────
  static async getContacts(organisationId, clientId) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (clientId) where.clientId = clientId;
    return await prisma.crmContact.findMany({
      where,
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      include: { client: { select: { id: true, name: true } } },
    });
  }

  static async addContact(organisationId, clientId, data, userName = "Admin") {
    const orgId = Number(organisationId);

    // If marked primary, unset previous primary contacts for this client
    if (data.isPrimary) {
      await prisma.crmContact.updateMany({
        where: { clientId, organisationId: orgId },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.crmContact.create({
      data: {
        clientId,
        organisationId: orgId,
        firstName: data.firstName,
        lastName: data.lastName || "",
        designation: data.designation,
        email: data.email,
        phone: data.phone,
        department: data.department,
        role: data.role || "Contact",
        isPrimary: Boolean(data.isPrimary),
        notes: data.notes,
        status: data.status || "Active",
      },
    });

    await prisma.crmActivity.create({
      data: {
        clientId,
        organisationId: orgId,
        type: "Contact added",
        description: `Added contact ${contact.firstName} ${contact.lastName || ""} (${contact.designation || contact.role || "Contact"}).`,
        user: userName,
      },
    });

    return contact;
  }

  static async updateContact(id, organisationId, patch, userName = "Admin") {
    const orgId = Number(organisationId);

    if (patch.isPrimary) {
      const existing = await prisma.crmContact.findFirst({
        where: { id, organisationId: orgId },
      });
      if (existing) {
        await prisma.crmContact.updateMany({
          where: { clientId: existing.clientId, organisationId: orgId },
          data: { isPrimary: false },
        });
      }
    }

    const contact = await prisma.crmContact.update({
      where: { id, organisationId: orgId },
      data: patch,
    });

    await prisma.crmActivity.create({
      data: {
        clientId: contact.clientId,
        organisationId: orgId,
        type: "Contact added",
        description: `Contact ${contact.firstName} ${contact.lastName || ""} details updated.`,
        user: userName,
      },
    });

    return contact;
  }

  static async deleteContact(id, organisationId) {
    const orgId = Number(organisationId);
    return await prisma.crmContact.delete({
      where: { id, organisationId: orgId },
    });
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────
  static async getClientDocuments(organisationId, clientId) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (clientId) where.clientId = clientId;
    return await prisma.crmDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  static async addClientDocument(organisationId, clientId, data, userName = "Admin") {
    const orgId = Number(organisationId);
    const doc = await prisma.crmDocument.create({
      data: {
        clientId,
        organisationId: orgId,
        title: data.title,
        type: data.type || "Contract",
        status: data.status || "Draft",
        owner: data.owner || userName,
        fileKey: data.fileKey || null,
        version: data.version || "1.0",
      },
    });

    await prisma.crmActivity.create({
      data: {
        clientId,
        organisationId: orgId,
        type: "Document created",
        description: `Document "${doc.title}" created/linked.`,
        user: userName,
      },
    });

    return doc;
  }

  static async updateClientDocument(id, organisationId, patch) {
    const orgId = Number(organisationId);
    return await prisma.crmDocument.update({
      where: { id, organisationId: orgId },
      data: patch,
    });
  }

  static async deleteClientDocument(id, organisationId) {
    const orgId = Number(organisationId);
    return await prisma.crmDocument.delete({
      where: { id, organisationId: orgId },
    });
  }

  // ─── REQUESTS / TASKS ────────────────────────────────────────────────────
  static async getRequests(organisationId, clientId) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (clientId) where.clientId = clientId;
    return await prisma.crmRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  static async createRequest(organisationId, clientId, data, userName = "Admin") {
    const orgId = Number(organisationId);
    const client = await prisma.crmClient.findFirst({
      where: { id: clientId, organisationId: orgId },
    });

    const request = await prisma.crmRequest.create({
      data: {
        clientId,
        organisationId: orgId,
        clientName: client?.name || data.clientName || "Client",
        title: data.title,
        type: data.type || "New Document",
        description: data.description,
        priority: data.priority || "Medium",
        status: data.status || "New",
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
        requestedBy: data.requestedBy || userName,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
      },
    });

    await prisma.crmActivity.create({
      data: {
        clientId,
        organisationId: orgId,
        type: "Request created",
        description: `Request "${request.title}" created with ${request.priority} priority.`,
        user: userName,
      },
    });

    return request;
  }

  static async updateRequest(id, organisationId, patch, userName = "Admin") {
    const orgId = Number(organisationId);
    const updated = await prisma.crmRequest.update({
      where: { id, organisationId: orgId },
      data: patch,
    });

    if (patch.status) {
      await prisma.crmActivity.create({
        data: {
          clientId: updated.clientId,
          organisationId: orgId,
          type: "Request completed",
          description: `Request "${updated.title}" marked as ${patch.status}.`,
          user: userName,
        },
      });
    }

    return updated;
  }

  static async deleteRequest(id, organisationId) {
    const orgId = Number(organisationId);
    return await prisma.crmRequest.delete({
      where: { id, organisationId: orgId },
    });
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────
  static async getNotes(organisationId, clientId) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (clientId) where.clientId = clientId;
    return await prisma.crmNote.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  }

  static async createNote(organisationId, clientId, data, userName = "Admin") {
    const orgId = Number(organisationId);
    const note = await prisma.crmNote.create({
      data: {
        clientId,
        organisationId: orgId,
        title: data.title,
        description: data.description || "",
        createdBy: data.createdBy || userName,
        isPinned: Boolean(data.isPinned),
      },
    });

    await prisma.crmActivity.create({
      data: {
        clientId,
        organisationId: orgId,
        type: "Note added",
        description: `Note "${note.title}" added to client records.`,
        user: userName,
      },
    });

    return note;
  }

  static async updateNote(id, organisationId, patch) {
    const orgId = Number(organisationId);
    return await prisma.crmNote.update({
      where: { id, organisationId: orgId },
      data: patch,
    });
  }

  static async deleteNote(id, organisationId) {
    const orgId = Number(organisationId);
    return await prisma.crmNote.delete({
      where: { id, organisationId: orgId },
    });
  }

  // ─── ACTIVITIES ──────────────────────────────────────────────────────────
  static async getActivities(organisationId, clientId) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (clientId) where.clientId = clientId;
    return await prisma.crmActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true } } },
      take: 100,
    });
  }

  static async addActivity(organisationId, clientId, data, userName = "Admin") {
    const orgId = Number(organisationId);
    return await prisma.crmActivity.create({
      data: {
        clientId,
        organisationId: orgId,
        type: data.type || "Client updated",
        description: data.description,
        user: data.user || userName,
      },
    });
  }

  // ─── BATCH IMPORT / EXPORT ───────────────────────────────────────────────
  static async importClients(organisationId, clientRecords, userName = "Admin") {
    const orgId = Number(organisationId);
    const results = {
      total: clientRecords.length,
      successCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      created: [],
      errors: [],
    };

    for (let i = 0; i < clientRecords.length; i++) {
      const row = clientRecords[i];
      try {
        if (!row.name || !row.name.trim()) {
          results.failedCount++;
          results.errors.push({ row: i + 1, error: "Client name is required." });
          continue;
        }

        const dup = await this.checkDuplicate(orgId, {
          name: row.name,
          email: row.email,
          phone: row.phone,
        });

        if (dup.isDuplicate) {
          results.duplicateCount++;
          results.errors.push({
            row: i + 1,
            name: row.name,
            error: `Skipped: Duplicate client found (${dup.matchedClient.name})`,
          });
          continue;
        }

        const created = await this.createClient(orgId, row, userName);
        results.successCount++;
        results.created.push(created);
      } catch (err) {
        results.failedCount++;
        results.errors.push({ row: i + 1, name: row.name, error: err.message });
      }
    }

    return results;
  }

  // ─── TWO-WAY CRM ↔ DOCUMENT AUTOMATION TRIGGER ─────────────────────────
  static async onboardClientWithDocument(organisationId, clientData, templateName = "Mutual B2B NDA") {
    const orgId = Number(organisationId);
    const client = await this.createClient(orgId, clientData);

    let template = await prisma.documentTemplate.findFirst({
      where: { organisationId: orgId },
    });

    const mergeData = {
      client: {
        name: client.name,
        contact: client.contactPerson || "Authorized Signatory",
        email: client.email,
        address: `${client.city || "Mumbai"}, ${client.state || "Maharashtra"}`,
      },
      contract_id: `CTR-${Date.now().toString().slice(-6)}`,
      effective_date: new Date().toLocaleDateString("en-GB"),
      amount: 250000,
    };

    const templateContent =
      template?.content ||
      `MASTER SERVICES AGREEMENT\nBetween DocuCore Enterprise and {{client.name}}.\nEffective Date: {{effective_date}}.\nContract ID: {{contract_id}}.\nGoverning Law: India / USA.`;
    const rendered = TemplateMergeEngine.render(templateContent, mergeData);

    const doc = await prisma.document.create({
      data: {
        name: `${client.name} - Master Agreement.pdf`,
        type: "Contract",
        size: Buffer.byteLength(rendered, "utf8"),
        uploaded_by: "DocuCore CRM Engine",
        organisation_id: orgId,
      },
    });

    await prisma.crmDocument.create({
      data: {
        clientId: client.id,
        organisationId: orgId,
        title: doc.name,
        type: "Contract",
        status: "Active",
        owner: "Automated CRM Flow",
      },
    });

    return { client, document: doc };
  }
}

module.exports = CrmService;
