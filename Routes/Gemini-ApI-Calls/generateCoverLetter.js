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
User's Resume: 
${resumeText ? resumeText : "No resume available, please create a generic cover letter based on job description."}

Instructions:
1. Create a personalized, concise and compelling cover letter.
2. Match specific skills from the resume with job requirements.
3. Structure with clear paragraphs: introduction, why interested in role, relevant experience and skills, closing.
4. Include today's date and formal letter formatting, name email address from the resume if available.
5. Use "Sincerely," or "Best Regards," as closing.
6. Length: maximum 280 words.
7. Voice: professional, confident, enthusiastic.
8. Include email address name phone number from the resume if available.`;

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