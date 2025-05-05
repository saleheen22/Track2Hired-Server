import express from "express";

export function generateColdEmailRouter(
  jobsCollection,
  genAI,
  usersCollection,
) {
  const router = express.Router();

  router.post("/cold-email/:jobID", async (req, res) => {
    try {
      const jobID = req.params.jobID;
      const job = await jobsCollection.findOne({ jobID });

      if (!job) {
        return res.status(404).json({
          status: "error",
          message: "Job not found",
        });
      }

      // Get user's resume from usersCollection using the email from the job
      const userEmail = job.email;
      const user = await usersCollection.findOne({ email: userEmail });

      let resumeText = "";
      if (user && user.resume && user.resume.extractedText) {
        resumeText = user.resume.extractedText;
      } else {
        console.log("No resume found for user:", userEmail);
      }

      const prompt = `Write a concise, professional cold email for a job inquiry.
Job Title: ${job.title}
Company: ${job.company}
Job Description: ${job.description}

User's Resume:
${resumeText ? resumeText : "No resume available, please create a generic cold email based on job description."}

Instructions:
1. The email should be addressed to a hiring manager or recruiter.
2. Start with a brief introduction of the candidate (the user).
3. Clearly state interest in the position and company.
4. Highlight relevant skills and experience from the resume (if available).
5. Politely request an opportunity to discuss further or for a referral.
6. Keep the tone confident, polite, and enthusiastic.
7. Limit the email to 180 words.
8. Try to match skills/experience/project from the resume with job requirements and which are preferred mentioned in the job description and mention it in the email. [IMPORTANT].
9. End with a professional closing and include the user's name and contact information if available.`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const coldEmail =
        result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!coldEmail) {
        return res.status(500).json({
          status: "error",
          message: "Failed to generate cold email",
        });
      }

      await jobsCollection.updateOne(
        { jobID },
        { $set: { coldEmail, coldEmailGeneratedAt: new Date() } },
      );

      res.status(200).json({
        status: "success",
        jobID,
        coldEmail,
      });
    } catch (error) {
      console.error("Error generating cold email:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  });

  return router;
}
