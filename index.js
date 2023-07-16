const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
var jwt = require('jsonwebtoken');


// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=> {
    res.send('Car doctor is running')
});

const verifyJWT = (req, res, next)=> {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({error: true, message: 'Unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  console.log(token);
  jwt.verify(token, process.env.JWT_SECRET_TOKEN, (err, decoded)=> {
    if (err) {
    return res.status(401).send({error: true, message: 'Unauthorized access'})    
    }
    req.decoded = decoded;
    next();
  })

}



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


    // Jwt Routes
    app.post ('/jwt', (req, res)=> {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.JWT_SECRET_TOKEN, {
        expiresIn: '1h'
      })
      console.log(token)
      res.send({token})
    })
    // Service Related Routes

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

    // Orders Related Routes
    app.post('/checkout', async (req, res)=> {
      const check = req.body;
      const result = await checkoutCollection.insertOne(check);
      res.send(result)
      console.log(check)
    })

    app.get('/checkout',verifyJWT, async (req, res)=> {
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        return res.status(403).send({error: 1, message: 'Forbidden Access'})
      }
      console.log('Decoded', decoded)
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await checkoutCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/bookings/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await checkoutCollection.deleteOne(query)
        res.send(result)
    })
    app.patch('/bookings/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id : new ObjectId(id)};
        const updatedBooking = req.body;
        console.log(updatedBooking)
        const options = {upsert: true};
        const updatedStatus = {
          $set : {
            status : updatedBooking.status,
          }
        }
        const result = await checkoutCollection.updateOne(filter, updatedStatus, options);
        res.send(result)
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