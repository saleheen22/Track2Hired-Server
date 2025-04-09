import express from 'express';

export function statusToggleRouter(jobsCollection) {
    const router = express.Router();

    // Endpoint to toggle a status field: interview, offer, or applied
    router.patch('/toggle-status/:jobID', async (req, res) => {
        try {
            const { jobID } = req.params;
            const { field } = req.body; // Expected: "interview", "offer", or "applied"

            if (!['interview', 'offer', 'applied'].includes(field)) {
                return res.status(400).json({ message: "Invalid field. Must be one of: interview, offer, applied." });
            }

            // Find the job document by jobID
            const job = await jobsCollection.findOne({ jobID });
            if (!job) {
                return res.status(404).json({ message: "Job not found" });
            }

            // Toggle the field: if undefined or false, set true; if true, set false
            const newValue = !job[field];

            // Update the job document with the new value
            const updateResult = await jobsCollection.updateOne(
                { jobID },
                { $set: { [field]: newValue } }
            );

            res.status(200).json({ message: "Status updated", field, value: newValue });
        } catch (error) {
            console.error("Error toggling status:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    return router;
}