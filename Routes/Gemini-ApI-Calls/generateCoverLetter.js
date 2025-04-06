import express from 'express';

export function generateCoverLetterRouter(jobsCollection, genAI) {
  const router = express.Router();

  router.post('/generate-cover-letter/:jobID', async (req, res) => {
    try {
      const jobID = req.params.jobID;
      const job = await jobsCollection.findOne({ jobID });
      if (!job) {
        return res.status(404).json({
          status: "error",
          message: "Job not found"
        });
      }
      const prompt = `Generate a professional cover letter for the following job:
Job Title: ${job.title}
Job Description: ${job.description}
Please produce a concise and compelling cover letter based on title and description can be generic and Please output the text in a preformatted style with clear line breaks, indentations, and white spaces exactly as you would in a final document. Make sure each paragraph and section is clearly separated. `;
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash	' });
      const result = await model.generateContent(prompt);
      const coverLetter = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!coverLetter) {
        return res.status(500).json({
          status: "error",
          message: "Failed to generate cover letter"
        });
      }
      console.log("Generated Cover Letter:", coverLetter.length);
      await jobsCollection.updateOne(
        { jobID },
        { $set: { coverLetter, coverLetterGeneratedAt: new Date() } }
      );
      res.status(200).json({
        status: "success",
        jobID,
        coverLetter
      });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error"
      });
    }
  });

  return router;
}