
const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')

const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000

// middleware

// j2FX0eYrm60uCeWt
// bistroBoss

app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k8vw6eq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const menuCollection = client.db('bistroDB').collection("menu")
    const cartCollection = client.db('bistroDB').collection("cartItem")
    const userCollection = client.db('bistroDB').collection("users")


    // verify token

    const verifyToken = (req, res, next) => {

      // console.log("inside verify token: ", req.headers.authorization)

      if(!req.headers.authorization){
        return res.status(401).send({message : "unauthorized access"})
      }

      const token = req.headers.authorization.split(' ')[1]
      

      console.log('inside ', token)

      next()
    }

    // jwt related api

    app.post('/jwt', async(req, res)=> {

      const user = req.body

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1h'})

      res.send({token})



    })


    // users related api

    app.post('/users', async(req, res)=> {

      const user = req.body

    
      

      // insert email if user does not exist 
      const query = {
        email : user.email
      }

      const existingUser = await userCollection.findOne(query)

  

      if(existingUser){

        return res.send({message : "user already exists"})
      }

      const result = await userCollection.insertOne(user)

      res.send(result)



    })

    // get the users

    app.get('/users', verifyToken, async(req, res)=> {

    
      const result = await userCollection.find().toArray()

      res.send(result)
    })

    // delete the user

    app.delete("/users/:id", async(req, res)=> {

      const id = req.params.id

      

      const result = await userCollection.deleteOne(query)

      res.send(result)



    })

    // patch the user

    app.patch('/users/admin/:id', async(req, res)=> {

      const id = req.params.id

      const filter = {_id : new ObjectId(id)}

      const updateDoc = {
        $set: {
          role : "admin"
        },
      };

      const result =  await userCollection.updateOne(filter, updateDoc)

      res.send(result)



    })

   

    // cart item related api

    app.post("/carts" , async(req, res)=> {

      const itemCart = req.body

      const result = await cartCollection.insertOne(itemCart);

      res.send(result)



    })

    app.get('/carts', async(req, res)=> {

      const email = req.query.email

      const query = {
        email : email
      }

      const result = await cartCollection.find(query).toArray()

      res.send(result)
    })

    

    app.delete('/carts/:id', async(req, res)=> {

      const id = req.params.id

      const query = {
        _id : new ObjectId(id)
      }


      const result = await cartCollection.deleteOne(query)

      res.send(result)



      
    })



    // menu related api


    app.get("/menu", async(req, res)=> {

        const result = await menuCollection.find().toArray()
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


app.get('/', async(req, res)=> {
    res.send('bistro boss server is running')
})

app.listen(port, ()=> {
    console.log(`bistro boss server is running on port : `, port)
})