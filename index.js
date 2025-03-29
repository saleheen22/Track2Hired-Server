import express from 'express';
import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 3000;


//middlewares
app.use(express.json()); // for parsing application/json
app.use(cors()); // for enabling CORS (Cross-Origin Resource Sharing)



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6vcfr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Create database and collection
    const db = client.db("track2hired"); // database name
    const usersCollection = db.collection("users"); // collection name
    const jobsCollection = db.collection("jobs"); // another collection

    app.post('/jobs', async (req, res) => {
        const job = req.body;
        const result = await jobsCollection.insertOne(job);
        res.send(result);
    })
    app.get('/alljobs', async(req, res)=> {
        const query = {};
        const cursor = jobsCollection.find(query);
        const allJobs = await cursor.toArray();
        res.send(allJobs);

    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Track 2 Hired')
})

app.listen(port, ()=> {
    console.log(`Server is running on PORT: ${port}`);
})