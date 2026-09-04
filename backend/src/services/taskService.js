const { taskRepository, notificationRepository } = require("../repositories");

/**
 * Task Service
 * Handles task assignment, workflow tasks, and status tracking
 */

const taskService = {
  /**
   * Get all tasks with filtering
   */
  async getTasks(params) {
    return await taskRepository.findMany(params);
  },

  /**
   * Get task by ID
   */
  async getTaskById(id) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new Error("Task not found.");
    }
    return task;
  },

  /**
   * Create a new task
   */
  async createTask(taskData) {
    if (!taskData.title || !taskData.organisation_id) {
      throw new Error("Task title and organisation ID are required.");
    }

    const task = await taskRepository.create(taskData);

    // Notify assignee if email provided
    if (taskData.assigned_email) {
      try {
        await notificationRepository.create({
          organisation_id: Number(taskData.organisation_id),
          title: "New Task Assigned",
          message: `You have been assigned the task "${taskData.title}".`,
          type: "TASK",
          priority: taskData.priority || "NORMAL",
          related_document: taskData.related_doc_name || null,
        });
      } catch (e) {
        // Non-blocking
      }
    }

    return task;
  },

  /**
   * Update task details or status
   */
  async updateTask(id, updateData) {
    const existing = await taskRepository.findById(id);
    if (!existing) {
      throw new Error("Task not found.");
    }

    return await taskRepository.update(id, updateData);
  },

  /**
   * Delete task
   */
  async deleteTask(id) {
    const existing = await taskRepository.findById(id);
    if (!existing) {
      throw new Error("Task not found.");
    }

    await taskRepository.deleteTask(id);

    return {
      success: true,
      message: "Task deleted successfully.",
    };
  },
};

module.exports = taskService;
