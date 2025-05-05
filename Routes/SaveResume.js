import express from "express";

export function saveResumeRouter(usersCollection) {
  const router = express.Router();

  // PATCH /resume/upload/:email to save or update a resume
  router.patch("/resume/upload/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const { fileName, extractedText, pdfData } = req.body; // pdfData now optional

      // Validate required fields - no longer requiring pdfData
      if (!email || !extractedText) {
        return res
          .status(400)
          .json({ message: "Missing required fields: email or extractedText" });
      }

      // Create resume object with available data
      const resumeData = {
        fileName: fileName || "resume.txt",
        extractedText,
        uploadDate: new Date(),
      };

      // Only add pdfData if it was provided
      if (pdfData) {
        resumeData.pdfData = pdfData;
      }

      // Find jobs for this email and update all with resume data
      const result = await usersCollection.updateMany(
        { email: email },
        {
          $set: {
            resume: resumeData,
          },
        },
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ message: "No jobs found for this email" });
      }

      res.status(200).json({
        success: true,
        message: `Resume text added to ${result.modifiedCount} job records`,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Error uploading resume:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  return router;
}
