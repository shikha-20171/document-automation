const PDFDocument = require('pdfkit');

/**
 * Generate a high-fidelity vector PDF for any Unified Document
 * @param {Object} document Document record with content sections, senderData, recipientData, etc.
 * @returns {Promise<Buffer>}
 */
async function generateUnifiedDocumentPdf(document) {
  return new Promise((resolve, reject) => {
    try {
      const sender = document.senderData || {};
      const pageSize = sender.pageSize || 'A4';
      const isLandscape = (sender.orientation || '').toLowerCase() === 'landscape';

      const doc = new PDFDocument({
        size: pageSize,
        layout: isLandscape ? 'landscape' : 'portrait',
        margin: 40,
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const companyName = sender.companyName || document.organisation?.name || 'Dezoryn Technology';
      const sections = Array.isArray(document.content) ? document.content : [];

      // Theme Colors
      const primaryColor = '#1e3a8a'; // Deep Navy
      const darkText = '#0f172a';
      const bodyText = '#334155';
      const mutedText = '#64748b';
      const lightBg = '#f8fafc';
      const borderColor = '#e2e8f0';

      // ---------------------------------------------------------
      // HEADER BAR
      // ---------------------------------------------------------
      const topY = 40;
      doc.rect(40, topY, 515, 5).fill(primaryColor);

      // Header Text (Organisation Default)
      if (sender.headerText) {
        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text(sender.headerText.toUpperCase(), 40, topY + 9, { width: 515 });
      }

      const brandTop = sender.headerText ? topY + 22 : topY + 14;

      // Company Brand (Left)
      doc
        .fontSize(15)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(companyName, 40, brandTop, { width: 300 });

      let senderY = doc.y + 2;
      doc.fontSize(7.5).font('Helvetica').fillColor(mutedText);
      if (sender.companyInfo) {
        const lines = sender.companyInfo.split('\n').filter(Boolean);
        lines.forEach((line) => {
          doc.text(line, 40, senderY, { width: 290 });
          senderY = doc.y + 1.5;
        });
      } else if (sender.address) {
        doc.text(sender.address, 40, senderY, { width: 280 });
        senderY = doc.y + 2;
      }
      const contactBits = [sender.email, sender.phone].filter(Boolean).join(' | ');
      if (contactBits && !sender.companyInfo?.includes(sender.email)) {
        doc.text(contactBits, 40, senderY, { width: 280 });
      }

      // Document Type & Meta (Right)
      const rightX = 350;
      const typeText = (document.documentType || 'OFFICIAL DOCUMENT').toUpperCase();
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(typeText, rightX, topY + 14, { align: 'right', width: 205 });

      const metaStartY = topY + 36;
      const metaRows = [
        ['Document No:', document.documentNumber || 'DOC-DRAFT'],
        ['Date:', formatDate(document.createdAt)],
        ['Status:', document.status || 'DRAFT'],
        ['Version:', `v${document.currentVersion || 1}.0`],
      ];

      metaRows.forEach(([lbl, val], idx) => {
        const y = metaStartY + idx * 12;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedText).text(lbl, rightX, y, { width: 95, align: 'right' });
        doc.fontSize(8).font('Helvetica').fillColor(darkText).text(val, rightX + 100, y, { width: 105, align: 'right' });
      });

      // Divider
      let cursorY = Math.max(doc.y + 16, 115);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(40, cursorY).lineTo(555, cursorY).stroke();
      cursorY += 12;

      // ---------------------------------------------------------
      // RECIPIENT / CLIENT BLOCK (If present)
      // ---------------------------------------------------------
      if (document.clientName) {
        doc.rect(40, cursorY, 515, 52).fill(lightBg).stroke(borderColor);

        doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('PREPARED FOR / RECIPIENT', 50, cursorY + 8);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(darkText).text(document.clientName, 50, cursorY + 20);

        const recMeta = [
          document.clientContactPerson ? `Attn: ${document.clientContactPerson}` : null,
          document.clientEmail ? `Email: ${document.clientEmail}` : null,
          document.clientPhone ? `Phone: ${document.clientPhone}` : null,
        ].filter(Boolean).join('  •  ');

        doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text(recMeta || 'Official Business Counterparty', 50, cursorY + 34);

        cursorY += 64;
      }

      // Document Title
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkText).text(document.title || 'Document', 40, cursorY);
      cursorY = doc.y + 14;

      // ---------------------------------------------------------
      // DYNAMIC CONTENT SECTIONS
      // ---------------------------------------------------------
      sections.forEach((sec, sIdx) => {
        // Check page break headroom
        if (cursorY > 690) {
          doc.addPage();
          cursorY = 45;
        }

        // Section Title
        if (sec.title && sec.type !== 'header') {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text(sec.title, 40, cursorY);
          cursorY = doc.y + 6;
        }

        // Handle Section Body (text / terms / header)
        if (sec.body) {
          const isTerms = sec.type === 'terms';
          doc.fontSize(8.5).font('Helvetica').fillColor(isTerms ? mutedText : bodyText);

          if (isTerms) {
            // Draw callout box for terms
            const bodyHeight = doc.heightOfString(sec.body, { width: 495, lineGap: 3 });
            if (cursorY + bodyHeight + 20 > 730) {
              doc.addPage();
              cursorY = 45;
            }
            doc.rect(40, cursorY, 515, bodyHeight + 16).fill(lightBg).stroke(borderColor);
            doc.fillColor(bodyText).text(sec.body, 50, cursorY + 8, { width: 495, lineGap: 3 });
            cursorY += bodyHeight + 24;
          } else {
            doc.text(sec.body, 40, cursorY, { width: 515, lineGap: 3 });
            cursorY = doc.y + 12;
          }
        }

        // Handle Data Table Section
        if (sec.type === 'table' && sec.tableData && Array.isArray(sec.tableData.headers)) {
          const headers = sec.tableData.headers;
          const rows = Array.isArray(sec.tableData.rows) ? sec.tableData.rows : [];
          const colCount = headers.length;
          const totalWidth = 515;
          const colWidth = Math.floor(totalWidth / colCount);

          // Table Header
          if (cursorY + 30 > 720) {
            doc.addPage();
            cursorY = 45;
          }

          doc.rect(40, cursorY, totalWidth, 18).fill(primaryColor);
          headers.forEach((h, cIdx) => {
            const isLast = cIdx === colCount - 1;
            doc
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text(String(h), 40 + cIdx * colWidth + 4, cursorY + 5, {
                width: colWidth - 8,
                align: isLast ? 'right' : 'left',
              });
          });
          cursorY += 18;

          // Table Rows
          rows.forEach((row, rIdx) => {
            const rowHeight = 20;
            if (cursorY + rowHeight > 720) {
              doc.addPage();
              cursorY = 45;
            }

            const isEven = rIdx % 2 === 0;
            doc.rect(40, cursorY, totalWidth, rowHeight).fill(isEven ? '#ffffff' : lightBg);
            doc.strokeColor(borderColor).lineWidth(0.5).rect(40, cursorY, totalWidth, rowHeight).stroke();

            (Array.isArray(row) ? row : []).forEach((cell, cIdx) => {
              const isLast = cIdx === colCount - 1;
              doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor(darkText)
                .text(String(cell || ''), 40 + cIdx * colWidth + 4, cursorY + 5, {
                  width: colWidth - 8,
                  align: isLast ? 'right' : 'left',
                });
            });

            cursorY += rowHeight;
          });

          cursorY += 14;
        }

        // Handle Signature Block
        if (sec.type === 'signature') {
          if (cursorY + 90 > 730) {
            doc.addPage();
            cursorY = 50;
          } else {
            cursorY += 10;
          }

          const boxWidth = 220;
          // Left Signatory (Organisation)
          const leftX = 40;
          doc.strokeColor(borderColor).lineWidth(1).moveTo(leftX, cursorY + 40).lineTo(leftX + boxWidth, cursorY + 40).stroke();
          doc.fontSize(8).font('Helvetica-Bold').fillColor(darkText).text('For ' + companyName, leftX, cursorY + 46, { width: boxWidth });
          doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('Authorized Signatory', leftX, cursorY + 56, { width: boxWidth });

          // Right Signatory (Client / Counterparty)
          const rightX = 335;
          doc.strokeColor(borderColor).lineWidth(1).moveTo(rightX, cursorY + 40).lineTo(rightX + boxWidth, cursorY + 40).stroke();
          doc.fontSize(8).font('Helvetica-Bold').fillColor(darkText).text('Accepted by: ' + (document.clientName || 'Counterparty'), rightX, cursorY + 46, { width: boxWidth });
          doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('Authorized Representative', rightX, cursorY + 56, { width: boxWidth });

          cursorY += 75;
        }
      });

      // ---------------------------------------------------------
      // FOOTER & PAGE NUMBERING ON ALL PAGES
      // ---------------------------------------------------------
      const range = doc.bufferedPageRange();
      const footerNotice = sender.footerText || `${document.documentNumber || 'DOCUMENT'} • v${document.currentVersion || 1}.0 • Generated via DocuCore AI`;
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, 800).lineTo(555, 800).stroke();
        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(mutedText)
          .text(
            `${footerNotice}  •  Page ${i + 1} of ${range.count}`,
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
  generateUnifiedDocumentPdf,
};
