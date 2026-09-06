const prisma = require("../config/prismaClient");


const auditLogger = (actionName) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    
    res.on("finish", async () => {
      
      const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
      if (!isMutation && !actionName) return;

      const user = req.user;
      const orgId = req.organisationId || user?.organisationId || null;
      const ipAddress = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
      const action = actionName || `${req.method} ${req.baseUrl || req.path}`;
      const statusCode = res.statusCode;
      const durationMs = Date.now() - startTime;

      try {
        if (orgId && prisma.activityLog) {
          await prisma.activityLog.create({
            data: {
              organisation_id: Number(orgId),
              action: action,
              user: user?.email || user?.full_name || "Anonymous",
              ip_address: String(ipAddress),
              details: JSON.stringify({
                method: req.method,
                path: req.originalUrl || req.url,
                statusCode,
                durationMs,
                userAgent: req.headers["user-agent"],
              }),
            },
          });
        }
      } catch (err) {
        
      }
    });

    next();
  };
};

module.exports = auditLogger;
module.exports.auditLogger = auditLogger;
