import express from "express";

export function getResumeRouter(usersCollection) {
  const router = express.Router();

  // GET /resume/:email to retrieve a user's resume data
  router.get("/resume/:email", async (req, res) => {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email parameter is required",
        });
      }

      // Find the user document by email
      const user = await usersCollection.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if resume exists
      if (!user.resume) {
        return res.status(404).json({
          success: false,
          message: "No resume found for this user",
        });
      }

      res.status(200).json({
        success: true,
        resume: user.resume,
      });
    } catch (error) {
      console.error("Error retrieving resume:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  return router;
}
