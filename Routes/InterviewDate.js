import express from "express";

export function interviewDateRouter(jobsCollection) {
  const router = express.Router();

  // PATCH /interview-date/:jobID to update the interview date
  router.patch("/interview-date/:jobID", async (req, res) => {
    try {
      const { jobID } = req.params;
      const { interviewDate } = req.body; 

        // Allow interviewDate to be null (for clearing)
    let updateValue;
    if (interviewDate === null) {
      updateValue = null;
    } else {
      const parsedDate = new Date(interviewDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      updateValue = parsedDate;
    }

     

      // Update the job document with the new interviewDate
      const result = await jobsCollection.updateOne(
        { jobID },
        { $set: { interviewDate: updateValue} },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.status(200).json({
        message: "Interview date updated successfully",
        jobID,
        interviewDate: updateValue,
      });
    } catch (error) {
      console.error("Error updating interview date:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
}
