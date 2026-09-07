const PDFDocument = require('pdfkit');
const { formatCurrency, round2 } = require('../utils/pricingCalculator');

/**
 * Generate a high-fidelity vector PDF for a Quotation
 * @param {Object} quotation Full quotation object with items, senderDetails, bankDetails
 * @returns {Promise<Buffer>}
 */
async function generateQuotationPdf(quotation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const currency = quotation.currency || 'INR';
      const sender = quotation.senderDetails || {};
      const bank = quotation.bankDetails || {};
      const items = quotation.items || [];

      // Colors
      const primaryColor = '#1e3a8a'; // Deep blue
      const secondaryColor = '#3b82f6';
      const darkText = '#0f172a';
      const mutedText = '#64748b';
      const lightBg = '#f8fafc';
      const borderColor = '#e2e8f0';

      // -------------------------------------------------------------
      // HEADER BAR
      // -------------------------------------------------------------
      const topY = 40;
      doc.rect(40, topY, 515, 6).fill(primaryColor);

      // Organization / Sender Name & Details (Left)
      const companyName = sender.companyName || quotation.organisation?.name || 'Enterprise Solutions';
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(companyName, 40, topY + 16, { width: 300 });

      let senderY = doc.y + 4;
      doc.fontSize(8.5).font('Helvetica').fillColor(mutedText);
      if (sender.address) {
        doc.text(sender.address, 40, senderY, { width: 280 });
        senderY = doc.y + 2;
      }
      const contactBits = [sender.email, sender.phone].filter(Boolean).join(' | ');
      if (contactBits) {
        doc.text(contactBits, 40, senderY, { width: 280 });
        senderY = doc.y + 2;
      }
      const taxBits = [
        sender.gstNumber ? `GST: ${sender.gstNumber}` : null,
        sender.panNumber ? `PAN: ${sender.panNumber}` : null,
      ].filter(Boolean).join(' | ');
      if (taxBits) {
        doc.text(taxBits, 40, senderY, { width: 280 });
      }

      // Quotation Badge & Meta (Right)
      const rightX = 350;
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('QUOTATION', rightX, topY + 16, { align: 'right', width: 205 });

      const metaStartY = topY + 44;
      const metaRows = [
        ['Quotation No:', quotation.quotationNumber || 'QT-DRAFT'],
        ['Issue Date:', formatDate(quotation.issueDate)],
        ['Valid Till:', quotation.expiryDate ? formatDate(quotation.expiryDate) : '30 Days from Issue'],
        ['Status:', quotation.status || 'DRAFT'],
      ];

      metaRows.forEach(([label, val], idx) => {
        const y = metaStartY + idx * 14;
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(mutedText)
          .text(label, rightX, y, { width: 90, align: 'right' });
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor(darkText)
          .text(val, rightX + 95, y, { width: 110, align: 'right' });
      });

      // Divider
      const headerBottom = Math.max(doc.y + 16, 125);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(40, headerBottom).lineTo(555, headerBottom).stroke();

      // -------------------------------------------------------------
      // CLIENT / BILLED TO SECTION
      // -------------------------------------------------------------
      const clientBoxY = headerBottom + 12;
      doc.rect(40, clientBoxY, 515, 68).fill(lightBg).stroke(borderColor);

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('BILLED TO (CLIENT DETAILS)', 52, clientBoxY + 8);

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(darkText)
        .text(quotation.clientName || 'Client Name', 52, clientBoxY + 22);

      let clientDetailsY = clientBoxY + 36;
      doc.fontSize(8.5).font('Helvetica').fillColor(mutedText);

      const clientMeta = [];
      if (quotation.clientContactPerson) clientMeta.push(`Attn: ${quotation.clientContactPerson}`);
      if (quotation.clientEmail) clientMeta.push(`Email: ${quotation.clientEmail}`);
      if (quotation.clientPhone) clientMeta.push(`Phone: ${quotation.clientPhone}`);
      
      doc.text(clientMeta.join('  •  ') || 'No contact details specified', 52, clientDetailsY, { width: 490 });
      if (quotation.clientAddress) {
        doc.text(quotation.clientAddress, 52, clientDetailsY + 12, { width: 490 });
      }

      // Title of Quote
      let cursorY = clientBoxY + 82;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(darkText)
        .text(`Subject: ${quotation.title || 'Professional Services Quotation'}`, 40, cursorY);

      cursorY += 18;

      // -------------------------------------------------------------
      // ITEMS TABLE
      // -------------------------------------------------------------
      const tableHeaders = [
        { label: '#', x: 40, width: 25, align: 'center' },
        { label: 'Item & Description', x: 65, width: 230, align: 'left' },
        { label: 'Qty', x: 295, width: 45, align: 'right' },
        { label: 'Unit', x: 340, width: 45, align: 'center' },
        { label: 'Rate', x: 385, width: 75, align: 'right' },
        { label: 'Amount', x: 460, width: 95, align: 'right' },
      ];

      // Header Row
      doc.rect(40, cursorY, 515, 20).fill(primaryColor);
      tableHeaders.forEach((th) => {
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text(th.label, th.x + 4, cursorY + 5, { width: th.width - 8, align: th.align });
      });

      cursorY += 20;

      // Table Rows
      items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        const rowBg = isEven ? '#ffffff' : lightBg;
        
        // Measure text height for description
        const descText = item.description ? String(item.description).trim() : '';
        const titleHeight = 12;
        const descHeight = descText ? doc.heightOfString(descText, { width: 220, fontSize: 7.5 }) : 0;
        const rowHeight = Math.max(24, titleHeight + descHeight + 10);

        // Page break if row spills over
        if (cursorY + rowHeight > 720) {
          doc.addPage();
          cursorY = 40;
          // Re-draw table header
          doc.rect(40, cursorY, 515, 20).fill(primaryColor);
          tableHeaders.forEach((th) => {
            doc
              .fontSize(8.5)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text(th.label, th.x + 4, cursorY + 5, { width: th.width - 8, align: th.align });
          });
          cursorY += 20;
        }

        // Row background
        doc.rect(40, cursorY, 515, rowHeight).fill(rowBg);
        doc.strokeColor(borderColor).lineWidth(0.5).rect(40, cursorY, 515, rowHeight).stroke();

        // Index
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(mutedText)
          .text(String(index + 1), 40 + 4, cursorY + 6, { width: 17, align: 'center' });

        // Title + Description
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(darkText)
          .text(item.title || 'Item', 65 + 4, cursorY + 6, { width: 222, align: 'left' });

        if (descText) {
          doc
            .fontSize(7.5)
            .font('Helvetica')
            .fillColor(mutedText)
            .text(descText, 65 + 4, cursorY + 18, { width: 222, align: 'left' });
        }

        // Qty
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor(darkText)
          .text(String(item.quantity || 1), 295 + 4, cursorY + 6, { width: 37, align: 'right' });

        // Unit
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(mutedText)
          .text(item.unit || 'unit', 340 + 4, cursorY + 6, { width: 37, align: 'center' });

        // Unit Price
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor(darkText)
          .text(formatCurrency(item.unitPrice || 0, currency), 385 + 4, cursorY + 6, { width: 67, align: 'right' });

        // Total
        const lineTotal = item.amount !== undefined ? item.amount : round2((item.quantity || 1) * (item.unitPrice || 0));
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(darkText)
          .text(formatCurrency(lineTotal, currency), 460 + 4, cursorY + 6, { width: 87, align: 'right' });

        cursorY += rowHeight;
      });

      // -------------------------------------------------------------
      // SUMMARY & TOTALS SECTION
      // -------------------------------------------------------------
      if (cursorY + 140 > 740) {
        doc.addPage();
        cursorY = 40;
      } else {
        cursorY += 10;
      }

      const summaryX = 330;
      const summaryWidth = 225;

      const summaryRows = [
        ['Subtotal:', formatCurrency(quotation.subtotal || 0, currency)],
      ];

      if (quotation.discountAmount > 0) {
        const discLabel = quotation.discountType === 'PERCENTAGE'
          ? `Discount (${quotation.discountValue}%):`
          : 'Discount:';
        summaryRows.push([discLabel, `- ${formatCurrency(quotation.discountAmount, currency)}`]);
      }

      if (quotation.taxAmount > 0 || quotation.taxRate > 0) {
        summaryRows.push([`Tax / GST (${quotation.taxRate || 18}%):`, `+ ${formatCurrency(quotation.taxAmount || 0, currency)}`]);
      }

      // Draw Summary Box
      let sumY = cursorY;
      summaryRows.forEach(([lbl, val]) => {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor(mutedText)
          .text(lbl, summaryX, sumY, { width: 120, align: 'right' });
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(darkText)
          .text(val, summaryX + 125, sumY, { width: 100, align: 'right' });
        sumY += 16;
      });

      // Grand Total Highlight
      doc.rect(summaryX - 5, sumY, summaryWidth + 10, 26).fill(primaryColor);
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('Grand Total:', summaryX + 4, sumY + 7, { width: 115, align: 'right' });
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text(formatCurrency(quotation.total || 0, currency), summaryX + 125, sumY + 6, { width: 100, align: 'right' });

      // -------------------------------------------------------------
      // BANK & PAYMENT DETAILS (Left side of totals)
      // -------------------------------------------------------------
      if (bank.bankName || bank.accountNumber || bank.upiId) {
        const bankBoxY = cursorY;
        doc.rect(40, bankBoxY, 265, sumY - cursorY + 26).fill(lightBg).stroke(borderColor);
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('BANK & PAYMENT DETAILS', 48, bankBoxY + 6);

        let bankInfoY = bankBoxY + 18;
        const bankFields = [
          bank.bankName ? `Bank: ${bank.bankName}` : null,
          bank.accountName ? `A/C Name: ${bank.accountName}` : null,
          bank.accountNumber ? `A/C No: ${bank.accountNumber}` : null,
          bank.ifscCode ? `IFSC: ${bank.ifscCode}` : null,
          bank.branch ? `Branch: ${bank.branch}` : null,
          bank.upiId ? `UPI ID: ${bank.upiId}` : null,
        ].filter(Boolean);

        bankFields.forEach((bf) => {
          doc.fontSize(7.5).font('Helvetica').fillColor(darkText).text(bf, 48, bankInfoY);
          bankInfoY += 10;
        });
      }

      cursorY = sumY + 36;

      // -------------------------------------------------------------
      // TERMS & CONDITIONS & NOTES
      // -------------------------------------------------------------
      if (cursorY + 90 > 750) {
        doc.addPage();
        cursorY = 40;
      }

      if (quotation.termsAndConditions || quotation.notes || quotation.paymentTerms) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('TERMS & CONDITIONS', 40, cursorY);
        cursorY += 12;

        const terms = [
          quotation.paymentTerms ? `• Payment Terms: ${quotation.paymentTerms}` : null,
          quotation.termsAndConditions ? `• ${quotation.termsAndConditions}` : null,
          quotation.notes ? `• Note: ${quotation.notes}` : null,
        ].filter(Boolean).join('\n');

        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(mutedText)
          .text(terms, 40, cursorY, { width: 330, lineGap: 3 });
      }

      // Signatory Box (Bottom Right)
      const signX = 400;
      const signY = cursorY + 10;
      doc.strokeColor(borderColor).lineWidth(1).moveTo(signX, signY + 35).lineTo(signX + 155, signY + 35).stroke();
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(darkText)
        .text('Authorized Signatory', signX, signY + 40, { width: 155, align: 'center' });
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor(mutedText)
        .text(companyName, signX, signY + 50, { width: 155, align: 'center' });

      // -------------------------------------------------------------
      // FOOTER & PAGE NUMBERS ON ALL PAGES
      // -------------------------------------------------------------
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, 800).lineTo(555, 800).stroke();
        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(mutedText)
          .text(
            `Quotation #${quotation.quotationNumber || 'DRAFT'} • Generated with DocuCore AI • Page ${i + 1} of ${range.count}`,
            40,
            806,
            { align: 'center', width: 515 }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function formatDate(d) {
  if (!d) return '';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return String(d);
  }
}

module.exports = {
  generateQuotationPdf,
};
