const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=> {
    res.send('Car doctor is running')
});

const uri =`mongodb+srv://${process.env.USER_Key}:${process.env.SECRET_Key}@cluster0.q4abhch.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    
    const serviceCollection = client.db("car-doctor").collection('services');
    const checkoutCollection = client.db('car-doctor').collection('checkout');


    app.get('/services', async (req, res)=> {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    });

    app.get('/services/:id', async(req, res)=> {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await serviceCollection.findOne(query);
      res.send(result)
    })

    // Orders
    app.post('/checkout', async (req, res)=> {
      const check = req.body;
      const result = await checkoutCollection.insertOne(check);
      res.send(result)
      console.log(check)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.listen(port, ()=> {
    console.log('Car Server is running on port', port)
})