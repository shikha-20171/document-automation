/**
 * Enterprise Document Validation Layer
 * Performs business rule reconciliation and cross-field consistency checks.
 *
 * Rules:
 * - Subtotal + Tax - Discount = Total
 * - Invoice due date cannot be before invoice date
 * - Required document numbers must exist
 * - Contract expiry cannot be before effective date
 * - Required fields must not be empty
 *
 * Statuses: VALID, WARNING, ERROR, NEEDS_REVIEW
 */

class DocumentValidationService {
  /**
   * Validate extracted data according to document type
   */
  static validate(documentType, extractedData = {}, fields = []) {
    const checks = [];
    let hasError = false;
    let hasWarning = false;

    const data = extractedData?.data || extractedData || {};
    const fieldMap = {};
    if (Array.isArray(fields)) {
      fields.forEach((f) => {
        if (f.key) fieldMap[f.key] = f.value;
      });
    }

    const type = (documentType || 'Other').toUpperCase();

    // Helper to parse numerical value
    const parseNum = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'number') return val;
      const clean = String(val).replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? null : parsed;
    };

    // Helper to parse date
    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    // 1. Math Reconciliation for Invoice / Quotation / Purchase Order
    if (type.includes('INVOICE') || type.includes('QUOTATION') || type.includes('PURCHASE')) {
      const subtotal = parseNum(data.subtotal || fieldMap.subtotal || data.subTotal);
      const tax = parseNum(data.taxAmount || data.tax || fieldMap.tax || fieldMap.tax_amount || 0) || 0;
      const discount = parseNum(data.discount || data.discountAmount || fieldMap.discount || 0) || 0;
      const total = parseNum(data.total || data.grandTotal || data.totalAmount || fieldMap.total || fieldMap.grand_total);

      if (subtotal !== null && total !== null) {
        const expected = subtotal + tax - discount;
        const diff = Math.abs(expected - total);
        // Allow up to 1.0 tolerance for rounding
        if (diff <= 1.0) {
          checks.push({
            rule: 'Math Reconciliation',
            field: 'total',
            passed: true,
            severity: 'INFO',
            message: `Subtotal (${subtotal}) + Tax (${tax}) - Discount (${discount}) equals Total (${total}).`,
          });
        } else {
          hasError = true;
          checks.push({
            rule: 'Math Reconciliation',
            field: 'total',
            passed: false,
            severity: 'ERROR',
            message: `Discrepancy detected: Subtotal (${subtotal}) + Tax (${tax}) - Discount (${discount}) = ${expected.toFixed(2)}, but document states Total = ${total}. (Difference: ${diff.toFixed(2)})`,
          });
        }
      } else if (total === null) {
        hasWarning = true;
        checks.push({
          rule: 'Total Amount Required',
          field: 'total',
          passed: false,
          severity: 'WARNING',
          message: 'Total amount was not detected in document.',
        });
      }

      // Document Number Check
      const docNo = data.invoiceNumber || data.quotationNumber || data.poNumber || data.documentNumber || fieldMap.document_number;
      if (docNo && String(docNo).trim().length > 1) {
        checks.push({
          rule: 'Document Identifier',
          field: 'documentNumber',
          passed: true,
          severity: 'INFO',
          message: `Document Number "${docNo}" identified.`,
        });
      } else {
        hasWarning = true;
        checks.push({
          rule: 'Document Identifier',
          field: 'documentNumber',
          passed: false,
          severity: 'WARNING',
          message: 'Document number/reference was not clearly identified.',
        });
      }

      // Date Chronology Check
      const invoiceDate = parseDate(data.invoiceDate || data.quotationDate || data.date || fieldMap.date_1);
      const dueDate = parseDate(data.dueDate || data.validUntil || data.paymentDueDate || fieldMap.date_2);

      if (invoiceDate && dueDate) {
        if (dueDate.getTime() >= invoiceDate.getTime()) {
          checks.push({
            rule: 'Date Chronology',
            field: 'dueDate',
            passed: true,
            severity: 'INFO',
            message: 'Due date is on or after document creation date.',
          });
        } else {
          hasError = true;
          checks.push({
            rule: 'Date Chronology',
            field: 'dueDate',
            passed: false,
            severity: 'ERROR',
            message: `Due date (${dueDate.toISOString().split('T')[0]}) cannot precede creation date (${invoiceDate.toISOString().split('T')[0]}).`,
          });
        }
      }
    }

    // 2. Contract / Agreement / NDA Validation
    if (type.includes('CONTRACT') || type.includes('AGREEMENT') || type.includes('NDA')) {
      const effectiveDate = parseDate(data.effectiveDate || data.commencementDate || fieldMap.date_1);
      const expiryDate = parseDate(data.expiryDate || data.terminationDate || fieldMap.date_2);

      if (effectiveDate && expiryDate) {
        if (expiryDate.getTime() >= effectiveDate.getTime()) {
          checks.push({
            rule: 'Contract Term Validity',
            field: 'expiryDate',
            passed: true,
            severity: 'INFO',
            message: 'Expiry date occurs after effective commencement date.',
          });
        } else {
          hasError = true;
          checks.push({
            rule: 'Contract Term Validity',
            field: 'expiryDate',
            passed: false,
            severity: 'ERROR',
            message: 'Contract expiry date precedes effective start date.',
          });
        }
      }

      const partyA = data.partyA || data.vendorName || data.disclosingParty || fieldMap.party_1;
      const partyB = data.partyB || data.clientName || data.receivingParty || fieldMap.party_2;

      if (partyA || partyB) {
        checks.push({
          rule: 'Identified Parties',
          field: 'parties',
          passed: true,
          severity: 'INFO',
          message: `Parties identified: ${partyA || 'Party A'} & ${partyB || 'Party B'}`,
        });
      } else {
        hasWarning = true;
        checks.push({
          rule: 'Identified Parties',
          field: 'parties',
          passed: false,
          severity: 'WARNING',
          message: 'Legal counterparties were not clearly resolved.',
        });
      }
    }

    // Determine overall status
    let status = 'VALID';
    if (hasError) {
      status = 'ERROR';
    } else if (hasWarning) {
      status = 'WARNING';
    }

    return {
      status,
      isValid: !hasError,
      requiresReview: hasError || hasWarning,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = DocumentValidationService;
