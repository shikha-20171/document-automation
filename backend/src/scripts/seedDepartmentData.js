const prisma = require("../config/prismaClient");

async function seedDepartments() {
  console.log("Starting Department & User synchronization...");

  // 1. Ensure Organisation 1 exists or find first active organisation
  let org = await prisma.organisation.findFirst({
    where: { id: 1 },
  });

  if (!org) {
    org = await prisma.organisation.findFirst();
  }

  if (!org) {
    console.error("No organisation found!");
    return;
  }

  const orgId = org.id;
  console.log(`Using Organisation ID: ${orgId} (${org.name})`);

  // 2. Ensure standard departments exist for this organisation
  const standardDepartments = [
    {
      name: "Operations & Logistics",
      description: "Handles daily operations, supply chain, and logistics documentation",
    },
    {
      name: "Finance & Accounts",
      description: "Oversees billing, invoicing, budgeting, and financial reports",
    },
    {
      name: "Sales & Marketing",
      description: "Manages quotations, commercial proposals, and customer agreements",
    },
  ];

  const createdDepts = [];
  for (const deptData of standardDepartments) {
    let dept = await prisma.department.findFirst({
      where: {
        organisation_id: orgId,
        name: deptData.name,
      },
    });

    if (!dept) {
      dept = await prisma.department.create({
        data: {
          organisation_id: orgId,
          name: deptData.name,
          description: deptData.description,
        },
      });
      console.log(`Created department: ${dept.name} (ID: ${dept.id})`);
    } else {
      console.log(`Department exists: ${dept.name} (ID: ${dept.id})`);
    }
    createdDepts.push(dept);
  }

  const operationsDept = createdDepts.find((d) => d.name === "Operations & Logistics") || createdDepts[0];
  const financeDept = createdDepts.find((d) => d.name === "Finance & Accounts") || createdDepts[1];

  // 3. Ensure sample teams exist in Operations Department
  let opsTeam = await prisma.team.findFirst({
    where: {
      organisation_id: orgId,
      department: operationsDept.name,
      name: "Operations Alpha",
    },
  });

  if (!opsTeam) {
    opsTeam = await prisma.team.create({
      data: {
        organisation_id: orgId,
        name: "Operations Alpha",
        department: operationsDept.name,
        team_lead: "Team lead",
        members: 3,
      },
    });
    console.log(`Created team: ${opsTeam.name} (ID: ${opsTeam.id})`);
  }

  // 4. Map test accounts to Operations & Logistics
  const opsUserEmails = [
    "dept.manager@tcs.com",
    "manager@tcs.com",
    "manager@demo.com",
    "team.lead@tcs.com",
    "lead@tcs.com",
    "teamlead@demo.com",
    "employee@tcs.com",
    "employee@demo.com",
  ];

  for (const email of opsUserEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: {
          organisation_id: orgId,
          department_id: operationsDept.id,
          team_id: opsTeam.id,
        },
      });
      console.log(`Assigned user ${email} to Dept: ${operationsDept.name} (ID: ${operationsDept.id})`);
    }
  }

  // 5. Update Department Manager as owner if not set
  const deptManager = await prisma.user.findFirst({
    where: { email: { in: ["dept.manager@tcs.com", "manager@tcs.com", "manager@demo.com"] } },
  });
  if (deptManager) {
    await prisma.department.update({
      where: { id: operationsDept.id },
      data: { owner_user_id: deptManager.id, head: deptManager.full_name },
    });
  }

  console.log("Department & User synchronization completed successfully!");
}

seedDepartments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
