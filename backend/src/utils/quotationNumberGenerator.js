const prisma = require('../config/prismaClient');

/**
 * Generate sequential quotation number unique per organisation
 * Format: QT-YYYY-0001, QT-YYYY-0002, etc.
 * @param {number} organisationId
 * @returns {Promise<string>}
 */
async function generateQuotationNumber(organisationId) {
  const currentYear = new Date().getFullYear();
  const prefix = `QT-${currentYear}-`;

  // Find latest quotation for this organisation matching prefix
  const latestQuote = await prisma.quotation.findFirst({
    where: {
      organisationId,
      quotationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quotationNumber: 'desc',
    },
    select: {
      quotationNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestQuote && latestQuote.quotationNumber) {
    const parts = latestQuote.quotationNumber.split('-');
    if (parts.length >= 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) {
        nextSequence = seq + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}

module.exports = {
  generateQuotationNumber,
};
