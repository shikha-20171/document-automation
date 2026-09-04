const fs = require("fs");
const path = require("path");

const appFile = fs.readFileSync(path.resolve(__dirname, "../src/app.js"), "utf-8");

// Extract all app.use("/...", ...) lines
const mountRegex = /app\.(use|get|post|put|patch|delete)\(\s*["']([^"']+)["']\s*,\s*(?:require\(["']([^"']+)["']\)|([a-zA-Z0-9_]+))/g;

const routesDir = path.resolve(__dirname, "../src/routes");

console.log("=== PARSING BACKEND APP MOUNT TABLE ===");

const mounted = [];
let match;
while ((match = mountRegex.exec(appFile)) !== null) {
  const method = match[1].toUpperCase();
  const mountPath = match[2];
  const reqPath = match[3];
  const varName = match[4];
  mounted.push({ method, mountPath, reqPath, varName });
}

console.log(`Found ${mounted.length} explicit mounts in app.js.`);
mounted.forEach(m => console.log(`  ${m.method} ${m.mountPath} -> ${m.reqPath || m.varName}`));

// Now inspect each route file
const allBackendEndpoints = [];

function inspectRouter(router, prefix) {
  const stack = router.stack || [];
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      const p = (prefix + (layer.route.path === "/" ? "" : layer.route.path)).replace(/\/+/g, "/");
      for (const m of methods) {
        allBackendEndpoints.push({ method: m, path: p || "/" });
      }
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      let subPrefix = "";
      if (layer.regexp) {
        let str = layer.regexp.source || layer.regexp.toString();
        str = str.replace(/^\^\\?/, "").replace(/\(\?:\\?\/\(\?=\$\)\)\?\(\?=\\\?\/\|\$\).*$/, "").replace(/\(\?=\\\?\/\|\$\).*$/, "");
        str = str.replace(/\\\//g, "/").replace(/\\/g, "").replace(/\/\?$/, "");
        subPrefix = "/" + str;
      }
      inspectRouter(layer.handle, (prefix + subPrefix).replace(/\/+/g, "/"));
    }
  }
}

// Map varNames in app.js
const varMap = {
  authRoutes: "./routes/authRoutes",
  organisationRoutes: "./routes/organisationRoutes",
  organisationAdminRoutes: "./routes/organisationAdminRoutes",
  companyRoutes: "./routes/companyRoutes",
  emailRoutes: "./routes/emailRoutes",
  aiProviderRoutes: "./routes/aiProviderRoutes",
  aiModelRoutes: "./routes/aiModelRoutes",
  superAdminDashboardRoutes: "./routes/superAdminDashboardRoutes",
  superAdminStorageRoutes: "./routes/superAdminStorageRoutes",
  superAdminSubscriptionRoutes: "./routes/superAdminSubscriptionRoutes",
  superAdminAiManagementRoutes: "./routes/superAdminAiManagementRoutes",
  superAdminAuditLogRoutes: "./routes/superAdminAuditLogRoutes",
  superAdminSupportRoutes: "./routes/superAdminSupportRoutes",
  superAdminSettingsRoutes: "./routes/superAdminSettingsRoutes",
  superAdminModulesRoutes: "./routes/superAdminModulesRoutes",
};

for (const m of mounted) {
  let targetFile = m.reqPath;
  if (!targetFile && m.varName && varMap[m.varName]) {
    targetFile = varMap[m.varName];
  }
  if (targetFile) {
    const fullPath = path.resolve(__dirname, "../src", targetFile);
    try {
      const mod = require(fullPath);
      if (mod && mod.stack) {
        inspectRouter(mod, m.mountPath);
      }
    } catch (e) {
      console.error(`Error loading ${targetFile}:`, e.message);
    }
  }
}

console.log(`\nSuccessfully indexed ${allBackendEndpoints.length} route endpoints from all route files!`);

// Deduplicate backend endpoints
const uniqueBackend = new Map();
allBackendEndpoints.forEach(r => {
  const k = `${r.method} ${r.path}`;
  uniqueBackend.set(k, r);
});

console.log(`Total unique backend endpoints: ${uniqueBackend.size}`);

// Save to JSON
fs.writeFileSync(
  path.resolve(__dirname, "backend_endpoints.json"),
  JSON.stringify(Array.from(uniqueBackend.values()), null, 2)
);

process.exit(0);
