/**
 * Advanced Template & Conditional Merge Engine
 * Enterprise-grade template rendering with IF/ELSE logic, repeating line items, and dynamic formatting helpers.
 */

class TemplateMergeEngine {
  /**
   * Helper to format values
   */
  static formatValue(val, helper, arg) {
    if (val === null || val === undefined) return "";
    
    if (helper === "formatCurrency") {
      const currency = arg || "INR";
      const num = Number(val) || 0;
      if (currency === "INR") {
        return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (helper === "formatDate") {
      try {
        const d = new Date(val);
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return String(val);
      }
    }

    if (helper === "uppercase") {
      return String(val).toUpperCase();
    }

    if (helper === "lowercase") {
      return String(val).toLowerCase();
    }

    return String(val);
  }

  /**
   * Resolve nested property (e.g. "client.address.city")
   */
  static getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.trim().split(".");
    let curr = obj;
    for (const p of parts) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[p];
    }
    return curr;
  }

  /**
   * Evaluate conditional expression (e.g. "amount > 100000", "status == 'ACTIVE'", "is_vip")
   */
  static evaluateCondition(expr, data) {
    const trimmed = expr.trim();
    
    // Check comparison operators
    const operators = [
      { op: ">=", fn: (a, b) => Number(a) >= Number(b) },
      { op: "<=", fn: (a, b) => Number(a) <= Number(b) },
      { op: ">", fn: (a, b) => Number(a) > Number(b) },
      { op: "<", fn: (a, b) => Number(a) < Number(b) },
      { op: "==", fn: (a, b) => String(a).toLowerCase() === String(b).replace(/['"]/g, "").toLowerCase() },
      { op: "!=", fn: (a, b) => String(a).toLowerCase() !== String(b).replace(/['"]/g, "").toLowerCase() },
    ];

    for (const { op, fn } of operators) {
      if (trimmed.includes(op)) {
        const [leftVar, ...rest] = trimmed.split(op);
        const rightVal = rest.join(op).trim();
        const leftVal = this.getNestedValue(data, leftVar.trim()) ?? leftVar.trim();
        return fn(leftVal, rightVal);
      }
    }

    // Truthy check for single variable
    const val = this.getNestedValue(data, trimmed);
    return Boolean(val);
  }

  /**
   * Core merge function
   * @param {string} template - Raw template string containing variables, conditional blocks, and each blocks
   * @param {object} data - Merged dictionary containing scalar variables and arrays
   * @returns {string} Rendered document string
   */
  static render(template, data = {}) {
    if (!template || typeof template !== "string") return "";

    let output = template;

    // 1. Process Repeating Blocks: {{#each list_key}} ... {{/each}}
    const eachRegex = /\{\{#each\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    output = output.replace(eachRegex, (match, listKey, itemTemplate) => {
      const items = this.getNestedValue(data, listKey);
      if (!Array.isArray(items) || items.length === 0) return "";

      return items
        .map((item, idx) => {
          let itemRendered = itemTemplate;
          // Support @index and item fields
          itemRendered = itemRendered.replace(/\{\{@index\}\}/g, String(idx + 1));
          
          if (typeof item === "object" && item !== null) {
            const itemContext = { ...data, ...item };
            return this.render(itemRendered, itemContext);
          }
          return itemRendered.replace(/\{\{this\}\}/g, String(item));
        })
        .join("");
    });

    // 2. Process Conditional Blocks: {{#if expr}} ... ({{else}} ...)? {{/if}}
    const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
    output = output.replace(ifRegex, (match, conditionExpr, trueBranch, falseBranch = "") => {
      const isTrue = this.evaluateCondition(conditionExpr, data);
      const selectedBranch = isTrue ? trueBranch : falseBranch;
      return this.render(selectedBranch, data);
    });

    // 3. Process Format Helpers: {{helper var arg}} or {{helper var}}
    const helperRegex = /\{\{(formatCurrency|formatDate|uppercase|lowercase)\s+([a-zA-Z0-9_.]+)(?:\s+['"]?([^'"}]+)['"]?)?\}\}/g;
    output = output.replace(helperRegex, (match, helperName, varPath, arg) => {
      const val = this.getNestedValue(data, varPath);
      return this.formatValue(val, helperName, arg);
    });

    // 4. Process Simple Variable Interpolations: {{variable}} or {{nested.var}}
    const varRegex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
    output = output.replace(varRegex, (match, varPath) => {
      const val = this.getNestedValue(data, varPath);
      if (val === undefined || val === null) {
        return match; // preserve unmapped variable placeholder
      }
      return String(val);
    });

    return output;
  }

  /**
   * Extract all variable names and conditional requirements from template
   */
  static extractSchema(template) {
    if (!template || typeof template !== "string") return { variables: [], loops: [], conditions: [] };

    const variables = new Set();
    const loops = new Set();
    const conditions = new Set();

    const varMatches = template.matchAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g);
    for (const m of varMatches) {
      if (!m[1].startsWith("#") && !m[1].startsWith("/")) {
        variables.add(m[1]);
      }
    }

    const loopMatches = template.matchAll(/\{\{#each\s+([a-zA-Z0-9_.]+)\}\}/g);
    for (const m of loopMatches) {
      loops.add(m[1]);
    }

    const condMatches = template.matchAll(/\{\{#if\s+([^}]+)\}\}/g);
    for (const m of condMatches) {
      conditions.add(m[1].trim());
    }

    return {
      variables: Array.from(variables),
      loops: Array.from(loops),
      conditions: Array.from(conditions),
    };
  }
}

module.exports = TemplateMergeEngine;
