const prisma = require('../config/prismaClient');

/**
 * Prefix mapper for common document types
 */
const TYPE_PREFIXES = {
  // Sales
  'Quotation': 'QT',
  'Estimate': 'EST',
  'Invoice': 'INV',
  'Proforma Invoice': 'PI',
  'Purchase Order': 'PO',
  'Sales Order': 'SO',
  'Credit Note': 'CN',
  'Debit Note': 'DN',
  'Receipt': 'RCP',
  // Business
  'Business Proposal': 'PROP',
  'Project Proposal': 'PROP',
  'Statement of Work': 'SOW',
  'Scope of Work': 'SOW',
  'Project Brief': 'BRF',
  'Business Letter': 'LTR',
  // Legal
  'NDA': 'NDA',
  'Non-Disclosure Agreement': 'NDA',
  'Service Agreement': 'AGR',
  'Consultancy Agreement': 'AGR',
  'Vendor Agreement': 'VAGR',
  'Contract': 'CTR',
  // HR
  'Offer Letter': 'OFR',
  'Appointment Letter': 'APT',
  'Employment Agreement': 'EMP',
  'Experience Letter': 'EXP',
  'Relieving Letter': 'REL',
  'Salary Certificate': 'SAL',
  // Operational
  'Work Order': 'WO',
  'Delivery Note': 'DN',
  'Completion Certificate': 'CERT',
  'Service Report': 'REP',
  'Incident Report': 'INC',
};

/**
 * Generate sequential document number unique per organisation and document type
 * Example: INV-2026-0001, OFR-2026-0001, DOC-2026-0001
 * @param {number} organisationId
 * @param {string} documentType
 * @returns {Promise<string>}
 */
async function generateDocumentNumber(organisationId, documentType = 'Document') {
  const currentYear = new Date().getFullYear();
  const rawPrefix = TYPE_PREFIXES[documentType] || (documentType.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'DOC');
  const prefix = `${rawPrefix}-${currentYear}-`;

  const latestDoc = await prisma.unifiedDocument.findFirst({
    where: {
      organisationId,
      documentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      documentNumber: 'desc',
    },
    select: {
      documentNumber: true,
    },
  });

  let nextSeq = 1;
  if (latestDoc && latestDoc.documentNumber) {
    const parts = latestDoc.documentNumber.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}

module.exports = {
  generateDocumentNumber,
  TYPE_PREFIXES,
};
