const teamLeaderService = require("../services/teamLeaderService");

const getTasks = async (req, res) => {
  try {
    const { stats, tasks } = await teamLeaderService.getTasks(req);
    return res.status(200).json({ success: true, stats, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const task = await teamLeaderService.createTask(req);
    return res.status(201).json({
      success: true,
      message: `Task "${task.title}" assigned successfully!`,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await teamLeaderService.updateTask(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Task updated successfully!", data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
};
