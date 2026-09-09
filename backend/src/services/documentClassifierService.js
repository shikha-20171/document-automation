/**
 * Enterprise Document Classification Engine
 * Identifies document type with layout awareness and semantic patterns.
 * Unknown documents are classified as 'Unknown' rather than incorrectly forced.
 */

const GeminiAdapter = require('./aiGateway/adapters/GeminiAdapter');

const KNOWN_DOCUMENT_TYPES = [
  'Invoice',
  'Quotation',
  'Purchase Order',
  'Contract',
  'Agreement',
  'NDA',
  'Receipt',
  'Resume',
  'Application',
  'Report',
  'Letter',
  'Form',
  'Custom Document',
  'Unknown',
];

const CLASSIFICATION_RULES = [
  {
    type: 'Invoice',
    patterns: [
      /\btax\s+invoice\b/i,
      /\binvoice\s*(no|number|#|id)\b/i,
      /\bbill\s+to\b/i,
      /\bamount\s+due\b/i,
      /\bgstin\b/i,
      /\bhsn\/?sac\b/i,
      /\bpayment\s+due\s+date\b/i,
    ],
    minMatches: 2,
    weight: 0.95,
  },
  {
    type: 'Quotation',
    patterns: [
      /\bquotation\b/i,
      /\bproforma\s+invoice\b/i,
      /\bestimate\s*(no|#)?\b/i,
      /\bvalid\s+(until|thru|through)\b/i,
      /\bquote\s*(no|number|#)\b/i,
      /\bpricing\s+estimate\b/i,
    ],
    minMatches: 2,
    weight: 0.94,
  },
  {
    type: 'Purchase Order',
    patterns: [
      /\bpurchase\s+order\b/i,
      /\bp\.?o\.?\s*(no|number|#)\b/i,
      /\bship\s+to\b/i,
      /\border\s+date\b/i,
      /\bvendor\s+code\b/i,
    ],
    minMatches: 2,
    weight: 0.95,
  },
  {
    type: 'NDA',
    patterns: [
      /\bnon[\s-]disclosure\s+agreement\b/i,
      /\bconfidentiality\s+agreement\b/i,
      /\bconfidential\s+information\b/i,
      /\bdisclosing\s+party\b/i,
      /\breceiving\s+party\b/i,
    ],
    minMatches: 2,
    weight: 0.98,
  },
  {
    type: 'Contract',
    patterns: [
      /\bmaster\s+services?\s+agreement\b/i,
      /\bcontract\s+agreement\b/i,
      /\bterm\s+and\s+termination\b/i,
      /\bindemnification\b/i,
      /\bgoverning\s+law\b/i,
      /\bexecuted\s+by\s+and\s+between\b/i,
    ],
    minMatches: 2,
    weight: 0.95,
  },
  {
    type: 'Agreement',
    patterns: [
      /\bthis\s+agreement\b/i,
      /\bparty\s+of\s+the\s+first\s+part\b/i,
      /\bwhereas\b/i,
      /\bnow\s+therefore\b/i,
      /\bin\s+witness\s+whereof\b/i,
    ],
    minMatches: 2,
    weight: 0.90,
  },
  {
    type: 'Receipt',
    patterns: [
      /\breceipt\b/i,
      /\bcash\s+receipt\b/i,
      /\bpayment\s+received\b/i,
      /\btransaction\s+id\b/i,
      /\bpaid\s+amount\b/i,
    ],
    minMatches: 2,
    weight: 0.92,
  },
  {
    type: 'Resume',
    patterns: [
      /\bcurriculum\s+vitae\b/i,
      /\bresume\b/i,
      /\bwork\s+experience\b/i,
      /\beducation\b/i,
      /\bskills\s*&?\s*competencies\b/i,
    ],
    minMatches: 2,
    weight: 0.95,
  },
  {
    type: 'Report',
    patterns: [
      /\bexecutive\s+summary\b/i,
      /\baudit\s+report\b/i,
      /\bperformance\s+report\b/i,
      /\bfindings\s+and\s+recommendations\b/i,
      /\bstatus\s+report\b/i,
    ],
    minMatches: 2,
    weight: 0.90,
  },
  {
    type: 'Letter',
    patterns: [
      /\bdear\s+(mr|ms|dr|sir|madam)\b/i,
      /\bsincerely\b/i,
      /\bregards\b/i,
      /\bsubject\s*:\b/i,
      /\bto\s+whom\s+it\s+may\s+concern\b/i,
    ],
    minMatches: 2,
    weight: 0.88,
  },
];

class DocumentClassifierService {
  /**
   * Classify text using rule heuristics and optional LLM
   */
  static async classifyDocument(text, fileName = '') {
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      // Check fileName fallback
      const byName = DocumentClassifierService.classifyByFileName(fileName);
      if (byName) return byName;
      return {
        documentType: 'Unknown',
        confidence: 0.3,
        reason: 'Insufficient readable content for classification',
        isUnknown: true,
      };
    }

    // 1. Try rule-based heuristic score matching
    let bestType = 'Unknown';
    let bestScore = 0;
    let matchReasons = [];

    for (const rule of CLASSIFICATION_RULES) {
      let matches = 0;
      const matchedPatterns = [];

      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          matches++;
          matchedPatterns.push(pattern.source);
        }
      }

      if (matches >= rule.minMatches) {
        const score = Math.min(0.99, (matches / rule.patterns.length) * 0.4 + rule.weight * 0.6);
        if (score > bestScore) {
          bestScore = score;
          bestType = rule.type;
          matchReasons = matchedPatterns;
        }
      }
    }

    // 2. If confidence is high from rules, return immediately
    if (bestScore >= 0.88 && bestType !== 'Unknown') {
      return {
        documentType: bestType,
        confidence: parseFloat(bestScore.toFixed(2)),
        reason: `Matched semantic markers: ${matchReasons.slice(0, 3).join(', ')}`,
        isUnknown: false,
      };
    }

    // 3. If LLM key is configured, use Gemini for high-level semantic disambiguation
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const adapter = new GeminiAdapter({ apiKey: geminiKey });
        const prompt = `Classify this document into EXACTLY ONE of the following types:
${KNOWN_DOCUMENT_TYPES.join(', ')}.
If it does not clearly belong to any standard category, respond with "Unknown".

Return ONLY JSON:
{
  "documentType": "Invoice|Quotation|Contract|...",
  "confidence": 0.95,
  "reason": "Brief rationale"
}

Document sample:
${text.slice(0, 4000)}`;

        const aiRes = await adapter.generateText({ prompt, temperature: 0.0 });
        if (aiRes?.text) {
          const match = aiRes.text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (KNOWN_DOCUMENT_TYPES.includes(parsed.documentType)) {
              return {
                documentType: parsed.documentType,
                confidence: parseFloat(Number(parsed.confidence || 0.9).toFixed(2)),
                reason: parsed.reason || 'AI Semantic Classification',
                isUnknown: parsed.documentType === 'Unknown',
              };
            }
          }
        }
      } catch (err) {
        console.warn('[DocumentClassifier] LLM classification fallback to heuristics:', err.message);
      }
    }

    // 4. Return rule result or Unknown
    if (bestScore >= 0.65) {
      return {
        documentType: bestType,
        confidence: parseFloat(bestScore.toFixed(2)),
        reason: `Tentative pattern match: ${matchReasons.join(', ')}`,
        isUnknown: false,
      };
    }

    return {
      documentType: 'Unknown',
      confidence: 0.45,
      reason: 'No standard category matched with sufficient confidence',
      isUnknown: true,
    };
  }

  /**
   * Fast file name inference fallback
   */
  static classifyByFileName(fileName = '') {
    const fn = (fileName || '').toLowerCase();
    if (fn.includes('invoice') || fn.includes('bill')) return { documentType: 'Invoice', confidence: 0.75, reason: 'Filename indicator', isUnknown: false };
    if (fn.includes('quote') || fn.includes('quotation')) return { documentType: 'Quotation', confidence: 0.75, reason: 'Filename indicator', isUnknown: false };
    if (fn.includes('po') || fn.includes('purchase')) return { documentType: 'Purchase Order', confidence: 0.75, reason: 'Filename indicator', isUnknown: false };
    if (fn.includes('nda') || fn.includes('confidential')) return { documentType: 'NDA', confidence: 0.85, reason: 'Filename indicator', isUnknown: false };
    if (fn.includes('contract') || fn.includes('agreement')) return { documentType: 'Contract', confidence: 0.75, reason: 'Filename indicator', isUnknown: false };
    if (fn.includes('receipt')) return { documentType: 'Receipt', confidence: 0.80, reason: 'Filename indicator', isUnknown: false };
    if (fn.includes('resume') || fn.includes('cv')) return { documentType: 'Resume', confidence: 0.85, reason: 'Filename indicator', isUnknown: false };
    return null;
  }
}

module.exports = DocumentClassifierService;
