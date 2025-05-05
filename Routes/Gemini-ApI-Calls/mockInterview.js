import express from "express";

export function generateInterviewRouter(jobsCollection, genAI) {
  const router = express.Router();

  router.post("/generate-interview/:jobID", async (req, res) => {
    try {
      const jobID = req.params.jobID;
      const job = await jobsCollection.findOne({ jobID });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      const prompt = `Generate a structured mock interview for a ${job.title} position at ${job.company}.
      
Job Description:
${job.description}

Please create:
1.minimum 10  behavioral questions related to the job responsibilities, soft questions, typical HR questions.
2. as many as technical questions with multiple choice options (4 options each) relevant to the job requirements. Include the correct answer index (0-3) for each question.

Format the response as a valid JSON object with this structure:
{
  "behavioralQuestions": [
    {
      "id": "b1",
      "question": "question text here",
      "type": "behavioral"
    },
    ...more questions
  ],
  "technicalQuestions": [
    {
      "id": "t1",
      "question": "question text here",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 2,
      "type": "technical"
    },
    ...more questions
  ]
}

Please ensure the content is technically accurate and relevant to the job position.`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const generatedText =
        result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!generatedText) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate interview questions",
        });
      }

      // Extract JSON from the response
      let interviewData;
      try {
        // Find JSON content within the response (sometimes Gemini adds markdown formatting)
        const jsonRegex = /{[\s\S]*}/;
        const jsonMatch = generatedText.match(jsonRegex);

        if (jsonMatch) {
          interviewData = JSON.parse(jsonMatch[0]);
        } else {
          interviewData = JSON.parse(generatedText);
        }

        // Add generated flag and jobID
        interviewData.generated = true;
        interviewData.jobID = jobID;
      } catch (parseError) {
        console.error("Error parsing interview data:", parseError);
        return res.status(500).json({
          success: false,
          message: "Failed to parse generated interview questions",
        });
      }

      // Save to database
      await jobsCollection.updateOne(
        { jobID },
        {
          $set: {
            mockInterviewData: interviewData,
            interviewGeneratedAt: new Date(),
          },
        },
      );

      res.status(200).json({
        success: true,
        interviewData: interviewData,
      });
    } catch (error) {
      console.error("Error generating interview questions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  return router;
}
