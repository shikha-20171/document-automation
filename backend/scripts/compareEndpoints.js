const fs = require("fs");
const path = require("path");

const backendEndpoints = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "backend_endpoints.json"), "utf-8")
);

// Scan frontend calls
const frontendDir = path.resolve(__dirname, "../../frontend");
const frontendFiles = [];
function walkDir(dir, fileList) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".next" || file === ".git") continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
}
walkDir(frontendDir, frontendFiles);

const frontendCalls = [];
const apiCallRegex = /(?:api|apiClient|axios)\.(get|post|put|patch|delete)(?:<[^>]+>)?\s*\(\s*([`'"][^`'"]+[`'"])/g;

for (const filePath of frontendFiles) {
  const relPath = path.relative(frontendDir, filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  let match;
  while ((match = apiCallRegex.exec(content)) !== null) {
    let endpoint = match[2].slice(1, -1);
    frontendCalls.push({
      file: relPath,
      method: match[1].toUpperCase(),
      path: endpoint,
    });
  }
}

function normalize(p) {
  let clean = p.split("?")[0].trim();
  // If template literal or dynamic param
  clean = clean.replace(/\$\{[^}]+\}/g, ":param");
  clean = clean.replace(/:[a-zA-Z0-9_]+/g, ":param");
  // Normalize leading slash
  if (!clean.startsWith("/")) clean = "/" + clean;
  // Strip /api prefix if present for uniform comparison
  if (clean.startsWith("/api/")) {
    clean = clean.substring(4);
  }
  clean = clean.replace(/\/+$/, "") || "/";
  return clean;
}

const backendMap = new Map();
backendEndpoints.forEach((b) => {
  const norm = normalize(b.path);
  const key = `${b.method} ${norm}`;
  if (!backendMap.has(key)) {
    backendMap.set(key, b.path);
  }
});

const matched = [];
const mismatches = [];

for (const call of frontendCalls) {
  if (call.path.startsWith("${basePath}")) {
    matched.push({ ...call, note: "Dynamic base path" });
    continue;
  }

  const normPath = normalize(call.path);
  const key = `${call.method} ${normPath}`;

  if (backendMap.has(key)) {
    matched.push({ ...call, backendPath: backendMap.get(key) });
  } else {
    // Regex matching
    let found = false;
    for (const [bKey, bActual] of backendMap.entries()) {
      const [bMethod, bNorm] = bKey.split(" ");
      if (bMethod === call.method) {
        const regexStr = "^" + bNorm.replace(/:param/g, "[^/]+") + "$";
        const reg = new RegExp(regexStr);
        if (reg.test(normPath)) {
          matched.push({ ...call, backendPath: bActual });
          found = true;
          break;
        }
      }
    }
    if (!found) {
      mismatches.push({ ...call, normPath });
    }
  }
}

console.log("\n=== REAL MATCHING REPORT ===");
console.log(`Total Frontend API Calls: ${frontendCalls.length}`);
console.log(`Successfully Matched: ${matched.length}`);
console.log(`Unmatched Mismatches: ${mismatches.length}`);

if (mismatches.length > 0) {
  const grouped = {};
  for (const m of mismatches) {
    const k = `${m.method} ${m.path} (norm: ${m.normPath})`;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(m.file);
  }
  console.log("\n--- UNMATCHED ENDPOINTS ---");
  for (const [k, files] of Object.entries(grouped)) {
    console.log(`❌ ${k} -> in ${files.join(", ")}`);
  }
}

fs.writeFileSync(
  path.resolve(__dirname, "final_audit_diff.json"),
  JSON.stringify({ matched, mismatches }, null, 2)
);
console.log("\nSaved final_audit_diff.json");
process.exit(0);
