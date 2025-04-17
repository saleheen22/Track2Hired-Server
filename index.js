import express from 'express';
import 'dotenv/config';
import { generateInterviewRouter } from './Routes/Gemini-ApI-Calls/mockInterview.js';
import { generateColdEmailRouter } from './Routes/Gemini-ApI-Calls/generateColdEmailRouter.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateCoverLetterRouter } from './Routes/Gemini-ApI-Calls/generateCoverLetter.js';
import { CompanySearch } from './Routes/Gemini-ApI-Calls/CompanySearch.js';
import {getResumeRouter} from './Routes/getResume.js';
import { statusToggleRouter } from './Routes/StatusToggle.js';
import { interviewDateRouter } from './Routes/InterviewDate.js';
import { saveResumeRouter } from './Routes/SaveResume.js';
import { createUser } from './Routes/CreateUser.js';

const app = express();
const port = process.env.PORT || 3000;


//middlewares
app.use(express.json()); // for parsing application/json
app.use(cors()); // for enabling CORS (Cross-Origin Resource Sharing)
// On your server
app.use(cookieParser());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));


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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    await jobsCollection.createIndex(
      { email: 1, company: 1, title: 1 }, 
      { unique: true }
    );
    await usersCollection.createIndex(
      { email: 1 },
      { unique: true}
    );
    // create a new user
    app.use(createUser(usersCollection));
    app.post('/save/jobs', async (req, res) => {
      try{
        const job = req.body;
        // Generate unique jobID using email, company, and title
    const sanitizedEmail = job.email.split('@')[0]; // Get part before @
    const sanitizedCompany = job.company.replace(/\W+/g, '').toLowerCase(); // Remove special chars
    const sanitizedTitle = job.title.replace(/\W+/g, '').toLowerCase();
    const jobID = `${sanitizedEmail}-${sanitizedCompany}-${sanitizedTitle}`;
    const jobWithId = {
      ...job,
      jobID: jobID
    }

        const result = await jobsCollection.insertOne(jobWithId);
        res.send(result);
      }
      catch(error){
        if (error.code === 11000) {
          return res.status(409).send({ 
            status: "error", 
            message: "You've already saved this job" 
          });
        }
        res.status(500).send({
          status: "error",
          message: "Internal server error",
        });
      }
        
    });
  //jwt functionality

  app.post('/jwt', async (req, res) => {
    const userEmail = req.body;
    const token = jwt.token(userEmail, process.env.JWT_SECRET, {expiresIn: '24h'});
    res.cookie('track2hired', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',

    }).send({status: 'success', message: 'Token generated successfully'});

  })
    app.get('/alljobs', async(req, res)=> {
        const query = {};
        const cursor = jobsCollection.find(query);
        const allJobs = await cursor.toArray();
        res.send(allJobs);

    })
    app.get('/jobs/:email', async(req, res)=> {
      try {
        const email = req.params.email;
        const query = {email: email};
        const userJobs = await jobsCollection.find(query).sort({ dateExtracted: -1 }).toArray();
        res.send(userJobs);
      } catch (error) {
        console.error("Error fetching user jobs:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });
    app.use(generateInterviewRouter(jobsCollection, genAI));
    app.use(getResumeRouter(usersCollection));
    //toogle job status
    app.use(statusToggleRouter(jobsCollection));
    //gemini api
    app.use(generateCoverLetterRouter(jobsCollection, genAI, usersCollection));
    app.use(CompanySearch(jobsCollection, genAI));
    app.use(generateColdEmailRouter(jobsCollection, genAI, usersCollection));
// interview date
app.use(interviewDateRouter(jobsCollection));

//save resume
app.use(saveResumeRouter(usersCollection));
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