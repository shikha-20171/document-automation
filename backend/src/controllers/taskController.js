const prisma = require("../config/prismaClient");
const { normalizeRole } = require("../middleware/permissionEngine");

/**
 * Unified Task Controller
 * Scopes tasks strictly according to the role hierarchy:
 * ORGANISATION_ADMIN -> All Organisation Tasks
 * DEPARTMENT_MANAGER -> Department Tasks
 * TEAM_LEADER -> Team Tasks
 * EMPLOYEE/STAFF -> Assigned Tasks
 */

const getTasks = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organisation ID required." });
    }

    const role = normalizeRole(req.user.role);
    const userIdStr = String(req.user.id);
    const userEmail = req.user.email;

    let whereClause = { organisation_id: orgId };

    const deptId = req.user.department_id ? Number(req.user.department_id) : null;
    const teamId = req.user.team_id ? Number(req.user.team_id) : null;

    if (role === "DEPARTMENT_MANAGER") {
      if (deptId) {
        whereClause.department_id = deptId;
      }
    } else if (role === "TEAM_LEADER") {
      if (teamId) {
        whereClause.OR = [
          { team_id: teamId },
          { created_by_id: Number(req.user.id) },
          { assigned_to_id: userIdStr },
          { assigned_email: userEmail },
        ];
      } else if (deptId) {
        whereClause.department_id = deptId;
      }
    } else if (role === "EMPLOYEE" || role === "STAFF") {
      whereClause.OR = [
        { assigned_to_id: userIdStr },
        { assigned_email: userEmail },
        { created_by_id: Number(req.user.id) },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return res.json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);
    const {
      title,
      description,
      assigned_to,
      assigned_to_id,
      assigned_email,
      department_id,
      team_id,
      priority = "NORMAL",
      due_date,
      instructions,
      related_doc_id,
      related_doc_name,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Task title is required." });
    }

    const taskDeptId = department_id ? Number(department_id) : (req.user.department_id ? Number(req.user.department_id) : null);
    const taskTeamId = team_id ? Number(team_id) : (req.user.team_id ? Number(req.user.team_id) : null);

    // If assigned_email is passed but assigned_to_id is missing, look up user
    let finalAssigneeId = assigned_to_id ? String(assigned_to_id) : null;
    let finalAssigneeName = assigned_to || "Unassigned";

    if (!finalAssigneeId && assigned_email) {
      const foundUser = await prisma.user.findUnique({
        where: { email: assigned_email.trim().toLowerCase() },
        select: { id: true, full_name: true },
      });
      if (foundUser) {
        finalAssigneeId = String(foundUser.id);
        if (!assigned_to || assigned_to === "Unassigned") {
          finalAssigneeName = foundUser.full_name;
        }
      }
    }

    const task = await prisma.task.create({
      data: {
        organisation_id: orgId,
        department_id: taskDeptId,
        team_id: taskTeamId,
        created_by_id: Number(req.user.id),
        title,
        description,
        assigned_to: finalAssigneeName,
        assigned_to_id: finalAssigneeId,
        assigned_email: assigned_email || null,
        priority,
        status: "TODO",
        due_date: due_date || null,
        instructions: instructions || null,
        related_doc_id: related_doc_id || null,
        related_doc_name: related_doc_name || null,
      },
      include: {
        comments: true,
      },
    });

    // Create In-App Notification for Assignee
    if (finalAssigneeId) {
      try {
        await prisma.notification.create({
          data: {
            organisation_id: orgId,
            user_id: Number(finalAssigneeId),
            title: `New Task Assigned: ${title}`,
            message: `You have been assigned task: "${title}" by ${req.user.name || req.user.email}. Priority: ${priority}`,
            type: "TASK_ASSIGNED",
            category: "TASK",
            unread: true,
            link: "/employee/tasks",
          },
        });
      } catch {}
    }

    return res.status(201).json({ success: true, message: "Task created successfully.", data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, organisation_id: orgId },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    return res.json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "PENDING"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const task = await prisma.task.findFirst({
      where: { id, organisation_id: orgId },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status, updated_at: new Date() },
      include: { comments: true },
    });

    return res.json({ success: true, message: "Task status updated.", data: updatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Comment content cannot be empty." });
    }

    const task = await prisma.task.findFirst({
      where: { id, organisation_id: orgId },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        organisationId: orgId,
        userId: Number(req.user.id),
        authorName: req.user.name || req.user.full_name || req.user.email || "User",
        content: content.trim(),
      },
    });

    return res.status(201).json({ success: true, message: "Comment added.", data: comment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTaskStatus,
  addTaskComment,
};
