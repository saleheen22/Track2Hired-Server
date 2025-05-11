import express from "express";

export const deleteJobRouter = (jobsCollection) => {
  const router = express.Router();
  
  router.delete("/jobs/:jobID", async (req, res) => {
    try {
      const jobID = req.params.jobID;
      const result = await jobsCollection.deleteOne({ jobID });
      
      if (result.deletedCount === 0) {
        return res.status(404).send({ 
          status: "error", 
          message: "Job not found" 
        });
      }
      
      return res.status(200).send({ 
        status: "success", 
        message: "Job deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).send({
        status: "error",
        message: "Internal server error"
      });
    }
  });
  
  return router;
};