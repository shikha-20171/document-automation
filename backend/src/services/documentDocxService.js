const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} = require('docx');

/**
 * Generate a native editable Microsoft Word DOCX document
 * @param {Object} document Document record with sections, metadata
 * @returns {Promise<Buffer>}
 */
async function generateUnifiedDocumentDocx(document) {
  const sections = Array.isArray(document.content) ? document.content : [];
  const sender = document.senderData || {};
  const companyName = sender.companyName || document.organisation?.name || 'Enterprise Solutions';

  const docChildren = [];

  // Title
  docChildren.push(
    new Paragraph({
      text: document.title || 'Official Document',
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    })
  );

  // Metadata block
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Document Number: ', bold: true }),
        new TextRun({ text: document.documentNumber || 'DOC-DRAFT' }),
        new TextRun({ text: '    |    Date: ', bold: true }),
        new TextRun({ text: formatDate(document.createdAt) }),
        new TextRun({ text: '    |    Status: ', bold: true }),
        new TextRun({ text: document.status || 'DRAFT' }),
      ],
      spacing: { after: 200 },
    })
  );

  if (document.clientName) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Prepared For: ', bold: true }),
          new TextRun({ text: document.clientName }),
          document.clientContactPerson
            ? new TextRun({ text: ` (Attn: ${document.clientContactPerson})` })
            : new TextRun({ text: '' }),
        ],
        spacing: { after: 240 },
      })
    );
  }

  // Iterate over sections
  for (const sec of sections) {
    if (sec.title && sec.type !== 'header') {
      docChildren.push(
        new Paragraph({
          text: sec.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    }

    if (sec.body) {
      const paragraphs = sec.body.split('\n');
      for (const p of paragraphs) {
        if (p.trim()) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: p.trim(), size: 22 })],
              spacing: { after: 100 },
            })
          );
        }
      }
    }

    // Table section
    if (sec.type === 'table' && sec.tableData && Array.isArray(sec.tableData.headers)) {
      const headers = sec.tableData.headers;
      const rows = Array.isArray(sec.tableData.rows) ? sec.tableData.rows : [];

      const tableRows = [
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(h), bold: true, size: 20 })] })],
                shading: { fill: '1E3A8A' },
              })
          ),
        }),
      ];

      for (const row of rows) {
        tableRows.push(
          new TableRow({
            children: (Array.isArray(row) ? row : []).map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: String(cell || ''), size: 20 })] })],
                })
            ),
          })
        );
      }

      docChildren.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docChildren.push(new Paragraph({ spacing: { after: 200 } }));
    }

    // Signature section
    if (sec.type === 'signature') {
      const signTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({ text: '___________________________________' }),
                  new Paragraph({ children: [new TextRun({ text: 'For ' + companyName, bold: true })] }),
                  new Paragraph({ text: 'Authorized Signatory' }),
                ],
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({ text: '___________________________________' }),
                  new Paragraph({ children: [new TextRun({ text: 'Accepted by: ' + (document.clientName || 'Counterparty'), bold: true })] }),
                  new Paragraph({ text: 'Authorized Representative' }),
                ],
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
              }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      docChildren.push(new Paragraph({ spacing: { before: 300 } }));
      docChildren.push(signTable);
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  return Packer.toBuffer(doc);
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
  generateUnifiedDocumentDocx,
};
