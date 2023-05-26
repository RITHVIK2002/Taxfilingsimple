require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");

// const mysql = require('mysql');
// const moment = require('moment-timezone');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var session = require('express-session');
// const { promisify } = require('util');
// const crypto = require('crypto');
const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
};



const app = express();
app.use(cors(corsOptions)); // Use this after the variable declaration

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());




passport.serializeUser((user, done) => {
//   console.log("error")
    done(null, user.google_id);
  });
  
  passport.deserializeUser((id, done) => {
    console.log("errors is here");
    done(null,id);
    // done(null)
  });
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALL_BACK_URL,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails ,photos} = profile;
    console.log('google',id);
    const newUser = {
        google_id: id,
        name: displayName,
        email: emails[0].value,
        photo:photos[0].value
      };
      return done(null, newUser);
    // done(null,id);
  }));
  
  
  
  app.get('/', (req, res) => {
    console.log("good2");
    res.redirect(process.env.FRONT_END);
  });
  
  
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile','email'] }));
  
  app.get('/auth/google/home',
    passport.authenticate('google', { failureRedirect: '/' }),
    function (req, res){
        console.log("good");
      
        res.redirect(process.env.FRONT_END + 'home');
      
    }
  );
  app.get('/api/authenticate',(req,res)=>{
    res.send(req.user);
  })
  app.get('/logout',(req,res)=>{
    req.logout((err)=>{
      res.redirect(process.env.FRONT_END);
    })
  })

//mongo 


const multer = require('multer');
const { MongoClient, ServerApiVersion } = require('mongodb');



// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// MongoDB connection URI
const uri = "mongodb+srv://rithviksharma2002:KRIT2002@cluster0.p2s3qef.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.log('Failed to connect to MongoDB');
    console.error(err);
  }
}
connectToMongoDB();

// Define a POST route for uploading the form data and file
app.post('/upload', upload.single('form16'), async (req, res) => {
  const { name, email } = req.body;
  const form16File = req.file;

  try {
    // Store the data in MongoDB
    const db = client.db('taxfiling');
    const collection = db.collection('txf1');

    const document = {
      name,
      email,
      form16: form16File.filename,
    };

    await collection.insertOne(document);

    res.status(200).json({ message: 'Data uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while uploading data' });
  }
});
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
// User Download
app.get('/download/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch user data from MongoDB
    const db = client.db('taxfiling');
    const collection = db.collection('txf1');
    const user = await collection.findOne({ _id: ObjectId(userId) });

    if (!user || !user.form16) {
      return res.status(404).json({ message: 'User or file not found' });
    }
    
    // Set the headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${user.form16}`);

    // Read the file from the uploads directory and stream it to the response
    const filePath = path.join(__dirname, 'uploads', user.form16);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    // console.log("dsfsd");

    // console.log(res)
  } catch (err) {
    console.error("dfsdfsd",err);
    res.status(500).json({ message: 'An error occurred while downloading the file' });
  }
});

// Users
app.get('/users', async (req, res) => {
  try {
    // Fetch data from the "txf1" collection
    const db = client.db('taxfiling');
    const collection = db.collection('txf1');
    const users = await collection.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An error occurred while fetching users' });
  }
});

  if (process.env.NODE_ENV !== 'test') {
    app.listen(8080, () => {
      console.log('Server started on port 8080');
    });
  }
  
  module.exports = app; 
  