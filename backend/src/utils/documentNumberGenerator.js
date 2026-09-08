const prisma = require('../config/prismaClient');

/**
 * Prefix mapper for common document types
 */
const TYPE_PREFIXES = {
  // Sales
  'Quotation': 'DT-QT',
  'Estimate': 'DT-EST',
  'Invoice': 'DT-INV',
  'Proforma Invoice': 'DT-PI',
  'Purchase Order': 'DT-PO',
  'Sales Order': 'DT-SO',
  'Credit Note': 'DT-CN',
  'Debit Note': 'DT-DN',
  'Receipt': 'DT-RCP',
  // Business
  'Bid Document': 'DT-BID',
  'Bid': 'DT-BID',
  'Business Proposal': 'DT-PROP',
  'Project Proposal': 'DT-PROP',
  'Statement of Work': 'DT-SOW',
  'Scope of Work': 'DT-SOW',
  'Project Brief': 'DT-BRF',
  'Business Letter': 'DT-LTR',
  // Legal
  'NDA': 'DT-NDA',
  'Non-Disclosure Agreement': 'DT-NDA',
  'Service Agreement': 'DT-AGR',
  'Consultancy Agreement': 'DT-AGR',
  'Vendor Agreement': 'DT-VAGR',
  'Contract': 'DT-CTR',
  // HR
  'Offer Letter': 'DT-OFR',
  'Appointment Letter': 'DT-APT',
  'Employment Agreement': 'DT-EMP',
  'Experience Letter': 'DT-EXP',
  'Relieving Letter': 'DT-REL',
  'Salary Certificate': 'DT-SAL',
  // Operational
  'Work Order': 'DT-WO',
  'Delivery Note': 'DT-DN',
  'Completion Certificate': 'DT-CERT',
  'Service Report': 'DT-REP',
  'Incident Report': 'DT-INC',
};

/**
 * Generate sequential document number unique per organisation and document type
 * Example: DT-QT-2026-0001, DT-BID-2026-0001
 * @param {number} organisationId
 * @param {string} documentType
 * @returns {Promise<string>}
 */
async function generateDocumentNumber(organisationId, documentType = 'Document') {
  const currentYear = new Date().getFullYear();
  const rawPrefix = TYPE_PREFIXES[documentType] || `DT-${documentType.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'DOC'}`;
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
