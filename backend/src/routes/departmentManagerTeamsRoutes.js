const express = require("express");
const router = express.Router();
const {
  getTeamsData,
  createTeam,
  updateTeam,
  toggleTeamStatus,
  changeTeamLead,
  addTeamMember,
  removeTeamMember,
  inviteTeamLeader,
  resendTeamLeaderInvite,
  assignDocumentToTeam,
} = require("../controllers/departmentManagerTeamsController");

/**
 * @swagger
 * /department-manager/teams:
 *   get:
 *     summary: Get Teams Roster & Stats
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       200:
 *         description: Teams list returned.
 */
router.get("/", getTeamsData);
router.post("/", createTeam);
router.post("/create-team", createTeam);
router.post("/members", addTeamMember);
router.post("/invite-leader", inviteTeamLeader);
router.post("/invite-lead", inviteTeamLeader);
router.post("/resend-invite", resendTeamLeaderInvite);
router.post("/resend-lead-invite", resendTeamLeaderInvite);
router.post("/assign-document", assignDocumentToTeam);
router.put("/:id", updateTeam);
router.patch("/:id", updateTeam);
router.patch("/:id/status", toggleTeamStatus);
router.patch("/:id/toggle-status", toggleTeamStatus);
router.post("/:id/change-lead", changeTeamLead);
router.patch("/:id/change-lead", changeTeamLead);
router.delete("/members/:id", removeTeamMember);

module.exports = router;
