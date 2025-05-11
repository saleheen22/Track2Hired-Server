import express from "express";

export const updateJobRouter = (jobsCollection) => {
  const router = express.Router();
  
  router.patch("/jobs/:jobID", async (req, res) => {
    try {
      const jobID = req.params.jobID;
      const updates = req.body;
      
 
      
      const result = await jobsCollection.updateOne(
        { jobID }, 
        { $set: updates }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).send({
          status: "error",
          message: "Job not found"
        });
      }
      
      // Get the updated job to return
      const updatedJob = await jobsCollection.findOne({ jobID });
      
      return res.status(200).send({
        status: "success",
        message: "Job updated successfully",
        job: updatedJob
      });
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).send({
        status: "error",
        message: "Internal server error"
      });
    }
  });
  
  return router;
};