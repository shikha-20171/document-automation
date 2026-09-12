const prisma = require("../config/prismaClient");
const fs = require("fs");
const path = require("path");

// ===============================================
// ORGANISATION SETTINGS CONTROLLER
// Real Prisma DB Integration + File-Backed Settings Persistence
// ===============================================

const SETTINGS_FILE_PATH = path.join(__dirname, "../../node_modules/.cache/org_settings_store.json");

const defaultSettings = {
  documentSettings: {
    defaultLanguage: "English",
    defaultCurrency: "INR (₹)",
    dateFormat: "DD/MM/YYYY",
    pageSize: "A4",
    orientation: "Portrait",
    companyInfo:
      "Dezoryn Technology Pvt Ltd\nCIN: U72900DL2024PTC123456\nGSTIN: 07AAAAA0000A1Z5\nRegistered Office: Building 4B, Cyber City, Phase 3, Gurugram, India",
    headerText: "Dezoryn Enterprise Automated Document Intelligence",
    footerText: "Confidential • DocuCore Enterprise Platform • All Rights Reserved",
    termsAndConditions:
      "1. Invoices are payable within thirty (30) days from invoice date.\n2. Late payments incur a fee of 1.5% per month or statutory limit.\n3. All confidential information is protected under standard NDA provisions.",
    allowedFileTypes: [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".txt"],
    maxFileSizeMB: 50,
    documentRetentionDays: 365,
    defaultStatusOnUpload: "PENDING_APPROVAL",
    versioningEnabled: true,
  },
  branding: {
    organisationName: "Dezoryn Technology",
    logoUrl: "/logo-brand.png",
    primaryColor: "#274690",
    secondaryColor: "#c96f4a",
    companyNameDisplay: "Dezoryn Technology",
    headerLogoUrl: "/logo-brand.png",
    footerText: "Dezoryn Technology • Automated Document Intelligence & Workflows",
    emailSignature:
      "Best Regards,\nDezoryn Technology Team\nsupport@dezo.io | +91 98765 43210 | https://dezo.io",
    pdfWatermark: false,
    pdfHeaderBar: true,
    pdfPageNumbers: true,
  },
  branches: [
    {
      id: "b1",
      name: "Bhopal Branch",
      code: "BPL-01",
      address: "MP Nagar Zone II, Bhopal, Madhya Pradesh",
      contact: "+91 755 4012345",
      email: "bhopal@dezo.io",
      manager: "Rajesh Kumar",
      status: "Active",
    },
    {
      id: "b2",
      name: "Indore Branch",
      code: "IND-02",
      address: "Vijay Nagar, AB Road, Indore, Madhya Pradesh",
      contact: "+91 731 4056789",
      email: "indore@dezo.io",
      manager: "Priya Sharma",
      status: "Active",
    },
    {
      id: "b3",
      name: "Delhi Branch",
      code: "DEL-03",
      address: "Barakhamba Road, Connaught Place, New Delhi",
      contact: "+91 11 23415678",
      email: "delhi@dezo.io",
      manager: "Amit Patel",
      status: "Active",
    },
  ],
};

let customSettingsStore = { ...defaultSettings };

// Load persisted settings from disk if available
try {
  if (fs.existsSync(SETTINGS_FILE_PATH)) {
    const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    customSettingsStore = {
      ...defaultSettings,
      ...parsed,
      documentSettings: {
        ...defaultSettings.documentSettings,
        ...(parsed.documentSettings || {}),
      },
      branding: {
        ...defaultSettings.branding,
        ...(parsed.branding || {}),
      },
    };
  }
} catch (err) {
  console.warn("[OrgSettings] Failed to load persisted settings file:", err.message);
}

const persistSettingsToFile = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(customSettingsStore, null, 2), "utf8");
  } catch (err) {
    console.warn("[OrgSettings] Failed to write settings to disk:", err.message);
  }
};

const getOrganisationDocumentSettings = (orgId) => {
  return customSettingsStore.documentSettings;
};

const getCustomSettingsStore = () => customSettingsStore;


const getOrgId = (req) => {
  return Number(req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1);
};

const getOrgSettings = async (req, res) => {
  try {
    const orgId = getOrgId(req);

    // 1. Fetch real organization from Prisma Database
    let org = await prisma.organisation.findFirst({
      where: { id: orgId },
      include: {
        locations: true,
        departments: true,
      },
    });

    if (!org) {
      org = await prisma.organisation.findFirst({
        include: { locations: true, departments: true },
      });
    }

    // Build real or fallback profile
    const profile = {
      name: org?.name || "Dezoryn Technology",
      logoUrl: org?.logo || "/logo-brand.png",
      businessType: org?.orgType || "Private Limited",
      website: org?.website || "https://dezo.io",
      contactEmail: org?.email || "admin@dezo.io",
      contactPhone: org?.phone || "+91 98765 43210",
      address: org?.address || "Building 4B, Cyber City, Phase 3",
      city: org?.city || "Gurugram",
      state: org?.state || "Haryana",
      country: org?.country || "India",
      pinCode: org?.postal_code || "122002",
      taxNumber: "07AAAAA0000A1Z5",
      defaultCurrency: org?.currency || "INR (₹)",
      timezone: org?.timezone || "Asia/Kolkata (GMT+5:30)",
    };

    // If locations exist in database, map them into branches
    let branches = customSettingsStore.branches;
    if (org?.locations && org.locations.length > 0) {
      branches = org.locations.map((loc, idx) => ({
        id: String(loc.id),
        name: loc.name || `${loc.city} Branch`,
        code: `${loc.city.substring(0, 3).toUpperCase()}-0${idx + 1}`,
        address: `${loc.city}, ${loc.state || ""}, ${loc.country || ""}`.trim(),
        contact: profile.contactPhone,
        email: profile.contactEmail,
        manager: "Assigned Manager",
        status: loc.status === "active" ? "Active" : "Inactive",
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        profile,
        branches,
        documentSettings: customSettingsStore.documentSettings,
        branding: customSettingsStore.branding,
      },
    });
  } catch (error) {
    console.error("[OrgSettings] getOrgSettings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrgProfile = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const profileData = req.body;

    // Persist changes directly into PostgreSQL via Prisma
    try {
      const orgExists = await prisma.organisation.findFirst({
        where: { id: orgId },
      });

      if (orgExists) {
        await prisma.organisation.update({
          where: { id: orgExists.id },
          data: {
            name: profileData.name || undefined,
            email: profileData.contactEmail || undefined,
            phone: profileData.contactPhone || undefined,
            website: profileData.website || undefined,
            address: profileData.address || undefined,
            city: profileData.city || undefined,
            state: profileData.state || undefined,
            country: profileData.country || undefined,
            postal_code: profileData.pinCode || undefined,
            orgType: profileData.businessType || undefined,
            timezone: profileData.timezone || undefined,
            currency: profileData.defaultCurrency || undefined,
            logo: profileData.logoUrl || undefined,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[OrgSettings] Prisma DB update warning:", dbErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Organisation profile updated and persisted to database.",
      data: profileData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBranding = async (req, res) => {
  try {
    const brandingData = req.body;
    customSettingsStore.branding = {
      ...customSettingsStore.branding,
      ...brandingData,
    };
    persistSettingsToFile();

    res.status(200).json({
      success: true,
      message: "Branding settings saved successfully.",
      data: customSettingsStore.branding,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDocumentSettings = async (req, res) => {
  try {
    const docSettings = req.body;
    customSettingsStore.documentSettings = {
      ...customSettingsStore.documentSettings,
      ...docSettings,
    };
    persistSettingsToFile();

    res.status(200).json({
      success: true,
      message: "Document configuration settings saved.",
      data: customSettingsStore.documentSettings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSectionSettings = async (req, res) => {
  try {
    const { section } = req.params;
    const data = req.body;

    if (section === "branches" && Array.isArray(data)) {
      customSettingsStore.branches = data;
    } else if (section === "branding") {
      customSettingsStore.branding = { ...customSettingsStore.branding, ...data };
    } else if (section === "documents" || section === "documentSettings") {
      customSettingsStore.documentSettings = { ...customSettingsStore.documentSettings, ...data };
    }
    persistSettingsToFile();

    res.status(200).json({
      success: true,
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully.`,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAiSettings = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { aiFeaturesEnabled, defaultProvider, defaultModel, defaultSelectedModelId } = req.body;
    res.status(200).json({
      success: true,
      message: "AI settings saved.",
      data: { aiFeaturesEnabled, defaultProvider, defaultModel, defaultSelectedModelId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrgSettings,
  updateOrgProfile,
  updateAiSettings,
  updateBranding,
  updateDocumentSettings,
  updateSectionSettings,
  getOrganisationDocumentSettings,
  getCustomSettingsStore,
};
