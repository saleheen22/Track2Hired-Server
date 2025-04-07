import express from 'express';

export function CompanySearch(jobsCollection, genAI) {
  const router = express.Router();

  router.post('/companySearch/:jobID', async (req, res) => {
    try {
      const jobID = req.params.jobID;
      const job = await jobsCollection.findOne({ jobID });
      if (!job) {
        return res.status(404).json({
          status: "error",
          message: "Job not found"
        });
      }
      const prompt = `Research the company :${job.company} and their job culture what they do.The reason for the search is to prepare for an interview so that the interviewee can ask questions about the company and the job. The interviewee is looking for a job in the following field: ${job.title}. Please provide a detailed overview of the company, including its mission, values, and any recent news or developments. Additionally, include information about the job culture and any unique aspects of working at this company. .`;
// const prompt = `Search job for the following skills and experience:
// Job skill: React, Node.js, express, mongodb
// Job experience: 1years
//  Location:** any where in USA

// **2. Job Title Preference:** Junior /no expreience/ entry level

// **3. Salary Expectations:** any

// **4. Company Size/Type Preference:** Any
//  `;
      const model = genAI.getGenerativeModel(
        {
          model: 'gemini-2.0-flash',
          config: {
            tools: [{ googleSearch: {} }],
          }
        }
      );
      const result = await model.generateContent(prompt);
      const companyResearch = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!companyResearch) {
        return res.status(500).json({
          status: "error",
          message: "Failed to generate cover letter"
        });
      }
      console.log("Generated Cover Letter:", companyResearch.length);
      await jobsCollection.updateOne(
        { jobID },
        { $set: { companyResearch, companyResearchGeneratedAt: new Date() } }
      );
      res.status(200).json({
        status: "success",
        jobID,
        companyResearch
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