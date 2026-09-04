const prisma = require("../config/prismaClient");
const TemplateMergeEngine = require("./templateMergeEngine");

class CrmService {
  // ─── CLIENTS ─────────────────────────────────────────────────────────────
  static async getClients(organisationId, { search, status, department } = {}) {
    const where = { organisationId };
    if (status && status !== "All") where.status = status;
    if (department && department !== "All") where.department = department;
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { contactPerson: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
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
    return await prisma.crmClient.findFirst({
      where: { id, organisationId },
      include: {
        contacts: true,
        documents: true,
        requests: true,
        activities: { orderBy: { createdAt: "desc" } },
        notesList: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  static async createClient(organisationId, data) {
    const client = await prisma.crmClient.create({
      data: {
        organisationId,
        name: data.name,
        type: data.type || "Company",
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        industry: data.industry,
        companySize: data.companySize,
        status: data.status || "Active",
        department: data.department || "General",
        assignedTo: data.assignedTo || "Account Manager",
        tags: data.tags || [],
        notes: data.notes,
      },
    });

    // Record activity
    await prisma.crmActivity.create({
      data: {
        clientId: client.id,
        organisationId,
        type: "Client created",
        description: `Client "${client.name}" registered in CRM database.`,
        user: "Admin",
      },
    });

    return client;
  }

  static async updateClient(id, organisationId, patch) {
    const updated = await prisma.crmClient.update({
      where: { id },
      data: patch,
    });

    await prisma.crmActivity.create({
      data: {
        clientId: id,
        organisationId,
        type: "Client updated",
        description: `Client "${updated.name}" information updated.`,
        user: "Admin",
      },
    });

    return updated;
  }

  static async deleteClient(id, organisationId) {
    return await prisma.crmClient.delete({
      where: { id },
    });
  }

  // ─── CONTACTS ────────────────────────────────────────────────────────────
  static async addContact(organisationId, clientId, data) {
    const contact = await prisma.crmContact.create({
      data: {
        clientId,
        organisationId,
        firstName: data.firstName,
        lastName: data.lastName,
        designation: data.designation,
        email: data.email,
        phone: data.phone,
        department: data.department,
        role: data.role,
        isPrimary: Boolean(data.isPrimary),
        notes: data.notes,
        status: data.status || "Active",
      },
    });

    await prisma.crmActivity.create({
      data: {
        clientId,
        organisationId,
        type: "Contact added",
        description: `Added contact ${contact.firstName} ${contact.lastName || ""} (${contact.designation || "Member"}).`,
        user: "Admin",
      },
    });

    return contact;
  }

  // ─── TWO-WAY CRM ↔ DOCUMENT AUTOMATION TRIGGER ─────────────────────────
  /**
   * CRM Event: Onboard Client & Automatically Generate Master Services Agreement / NDA
   */
  static async onboardClientWithDocument(organisationId, clientData, templateName = "Mutual B2B NDA") {
    const client = await this.createClient(organisationId, clientData);

    // Find template or create fallback
    let template = await prisma.documentTemplate.findFirst({
      where: { organisationId },
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

    const templateContent = template?.content || `MASTER SERVICES AGREEMENT\nBetween DocuCore Enterprise and {{client.name}}.\nEffective Date: {{effective_date}}.\nContract ID: {{contract_id}}.\nGoverning Law: India / USA.`;
    const rendered = TemplateMergeEngine.render(templateContent, mergeData);

    const doc = await prisma.document.create({
      data: {
        name: `${client.name} - Master Agreement.pdf`,
        type: "Contract",
        size: Buffer.byteLength(rendered, "utf8"),
        uploaded_by: "DocuCore CRM Engine",
        organisation_id: organisationId,
      },
    });

    await prisma.crmDocument.create({
      data: {
        clientId: client.id,
        organisationId,
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
