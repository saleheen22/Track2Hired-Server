import express from 'express';

export function generateCoverLetterRouter(jobsCollection, genAI, usersCollection) {
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
      
      // Get user's resume from usersCollection using the email from the job
      const userEmail = job.email;
      const user = await usersCollection.findOne({ email: userEmail });
      
      let resumeText = '';
      if (user && user.resume && user.resume.extractedText) {
        resumeText = user.resume.extractedText;
      } else {
        console.log("No resume found for user:", userEmail);
        // Continue without resume text
      }

      const prompt = `Generate a professional cover letter for the following job:
Job Title: ${job.title}
Company: ${job.company}
Job Description: ${job.description}

User's Resume: 
${resumeText}

Please produce a personalized, concise and compelling cover letter based on the job details and the user's resume (if available). Match the skills in the resume with the job requirements where possible. Please output the text in a preformatted style with clear line breaks, indentations, and white spaces exactly as you would in a final document. Make sure each paragraph and section is clearly separated. and make sure to include the user's name and contact information at the top of the letter. The cover letter should be suitable for a job application and should not exceed 300 words. The user is applying for this job to get a better job in the following field: ${job.title}.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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