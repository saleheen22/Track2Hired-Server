import express from 'express';
 
export function createUser(usersCollection) {
    const router = express.Router();
    router.post('/create-user', async (req, res)=> {
        try{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);

        } catch(error){
            if (error.code === 11000){
                return res.status(409).json({
                    status: "error",
                    message: "User already exists"
                })
            }
            console.error("Error creating user:", error);
            res.status(500).json({
                status: "error",
                message: "Failed to create user"
            });
        }
    })
    return router;
}