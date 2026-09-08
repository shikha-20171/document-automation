const prisma = require('../config/prismaClient');

/**
 * Dezoryn Technology - Master Corporate Profile & Identity Service
 * Centralizes the company identity, branding, banking, tax registrations,
 * document numbering rules, and default terms for all document generation.
 */

const DEZORYN_CORPORATE_PROFILE = {
  id: 'dezoryn-tech-master',
  companyName: 'Dezoryn Technology',
  legalName: 'Dezoryn Technology Pvt Ltd',
  brandName: 'Dezoryn Technology',
  tagline: 'Enterprise AI & Automated Document Intelligence Systems',
  logoUrl: '/logo.png',
  website: 'https://www.dezoryn.com',
  email: 'contact@dezoryn.com',
  billingEmail: 'billing@dezoryn.com',
  phone: '+91 98765 43210',
  registeredAddress: 'Level 5, Tech Park One, Airport Road, Yerwada, Pune, Maharashtra 411006, India',
  billingAddress: 'Level 5, Tech Park One, Airport Road, Yerwada, Pune, Maharashtra 411006, India',
  city: 'Pune',
  state: 'Maharashtra',
  country: 'India',
  postalCode: '411006',
  gstin: '27AAACD1234E1Z5',
  pan: 'AAACD1234E',
  cin: 'U72900PN2023PTC123456',
  authorisedSignatory: {
    name: 'Aditya Sharma',
    designation: 'Director & VP Enterprise Solutions',
    email: 'aditya.sharma@dezoryn.com',
    phone: '+91 98765 43210',
    signatureText: 'For Dezoryn Technology Pvt Ltd (Authorised Signatory)',
  },
  paymentDetails: {
    bankName: 'HDFC Bank',
    accountName: 'Dezoryn Technology Pvt Ltd',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0000123',
    branch: 'Yerwada Branch, Pune',
    accountType: 'Current Account',
    upiId: 'dezoryn@hdfcbank',
  },
  defaultPaymentTerms: '50% advance upon project sign-off, 50% upon milestone completion and UAT delivery.',
  savedTermsAndConditions: [
    '1. Commercial Validity: Quotation and bid proposals remain firm and valid for 30 calendar days from the date of issue.',
    '2. Taxes & Levies: Applicable GST (18%) extra as per standard Indian Goods & Services Tax regulations unless explicitly indicated.',
    '3. Payment Schedule: Invoices are payable within 15 calendar days from the date of electronic transmission.',
    '4. Intellectual Property: Complete intellectual property, source code, and production deployment rights transfer to client upon receipt of final settlement.',
    '5. Warranty & Hypercare: 30 business days of complimentary hypercare support included post-production go-live.',
    '6. Governing Law: This commercial engagement is governed by the laws of India under the exclusive jurisdiction of courts in Pune, Maharashtra.',
  ],
  branding: {
    primaryColor: '#274690',
    secondaryColor: '#001b2e',
    accentColor: '#ffd9a0',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  documentNumberConfig: {
    quotationPrefix: 'DT-QT',
    bidPrefix: 'DT-BID',
    proposalPrefix: 'DT-PROP',
    invoicePrefix: 'DT-INV',
    contractPrefix: 'DT-CTR',
    agreementPrefix: 'DT-AGR',
    ndaPrefix: 'DT-NDA',
    defaultPrefix: 'DT-DOC',
  },
};

/**
 * Retrieve the saved organisation profile for document generation.
 * Guarantees that Dezoryn Technology identity is always returned with full branding.
 */
async function getOrganisationCompanyProfile(organisationId) {
  let profile = { ...DEZORYN_CORPORATE_PROFILE };

  if (organisationId) {
    try {
      const org = await prisma.organisation.findUnique({
        where: { id: parseInt(organisationId, 10) },
      });

      if (org) {
        // If the org name was still a placeholder, update it in DB to Dezoryn Technology
        if (org.name && ['sdfghjk', 'xyz', 'cvbnm', 'werty', 'dfghjk', 'xcvbnm', 'Enterprise Solutions'].includes(org.name)) {
          await prisma.organisation.update({
            where: { id: org.id },
            data: {
              name: 'Dezoryn Technology',
              email: org.email || 'contact@dezoryn.com',
              website: org.website || 'https://www.dezoryn.com',
              address: org.address || profile.registeredAddress,
              city: org.city || 'Pune',
              state: org.state || 'Maharashtra',
              country: org.country || 'India',
              postal_code: org.postal_code || '411006',
              currency: 'INR',
            },
          }).catch(() => {});
        }

        profile = {
          ...profile,
          companyName: 'Dezoryn Technology',
          legalName: 'Dezoryn Technology Pvt Ltd',
          email: org.email || profile.email,
          phone: org.phone || profile.phone,
          website: org.website || profile.website,
          registeredAddress: org.address || profile.registeredAddress,
          city: org.city || profile.city,
          state: org.state || profile.state,
          country: org.country || profile.country,
          postalCode: org.postal_code || profile.postalCode,
          logoUrl: org.logo || profile.logoUrl,
        };
      }
    } catch (err) {
      console.warn('[OrganisationProfileService] Profile retrieval note:', err.message);
    }
  }

  return profile;
}

module.exports = {
  DEZORYN_CORPORATE_PROFILE,
  getOrganisationCompanyProfile,
};
