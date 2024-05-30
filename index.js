


const express = require('express')
require('dotenv').config()

const app = express()

const cors = require('cors')

const jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const port = process.env.PORT || 5000

// middleware

// j2FX0eYrm60uCeWt
// bistroBoss

app.use(cors({
  origin : [
    'http://localhost:5174',
    'http://localhost:5173'  
  

  ]
}))

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


   // verify token

   const verifyToken = (req, res, next) => {

    // console.log("inside verify token: ", req.headers.authorization)

    if(!req.headers.authorization){
      return res.status(401).send({message : "unauthorized access"})
    }

    const token = req.headers.authorization.split(' ')[1]

    // verify the token

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=> {

      if(error){
        return res.status(401).send({message : "unauthorized access"})
      }

      req.decoded = decoded

      next()

    })

   



    
  }

  

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db('bistroDB').collection("menu")
    const cartCollection = client.db('bistroDB').collection("cartItem")
    const userCollection = client.db('bistroDB').collection("users")
    const paymentCollection = client.db('bistroDB').collection("payments")
  
 
    // jwt related api

    app.post('/jwt',  async(req, res)=> {

      const user = req.body

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1h'})

      res.send({token})



    })


    // users related api

    app.post('/users',  async(req, res)=> {

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

      // verifyUser

      const verifyAdmin = async(req, res, next) => {

        const email = req.decoded.email
  
        const query = {email : email}
  
        const user = await userCollection.findOne(query)
  
        const isAdmin = user?.role === "admin"
  
        if(!isAdmin){
          return res.status(403).send({message : "forbidden access"})
        }
  
        next()
  
      }
  

    // get the users

    app.get('/users', verifyToken, verifyAdmin, async(req, res)=> {

    
      const result = await userCollection.find().toArray()

      res.send(result)
    })

    

    // delete the user

    app.delete("/users/:id", verifyToken, verifyAdmin, async(req, res)=> {

      const id = req.params.id

      const query = {_id : new ObjectId(id)}

      

      const result = await userCollection.deleteOne(query)

      res.send(result)



    })

    // patch the user

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res)=> {

      const id = req.params.id

      const filter = {_id : new ObjectId(id)}

      const updateDoc = {
        $set: {
          role : "admin"
        }
      };

      const result =  await userCollection.updateOne(filter, updateDoc)

      res.send(result)



    })

    // checking isAdmin or not 

    app.get('/users/admin/:email', verifyToken, async(req, res)=> {

      const email = req.params.email

      

      if(email !== req.decoded.email){
        return res.status(401).send({message : 'unauthorized access'})
      }

      const query = {email : email}

      const user = await userCollection.findOne(query)

      let admin = false

      if(user){

        admin = user?.role === "admin" 
      }

      res.send({admin})



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

      console.log(query)


      const result = await cartCollection.deleteOne(query)

      res.send(result)

      
    })


    // menu related api


    app.get("/menu", async(req, res)=> {

        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    // adding menu item to the menu collection

    app.post("/menu", verifyToken, verifyAdmin, async(req, res)=> {

      const newItem = req.body

      const result = await menuCollection.insertOne(newItem)

       
        res.send(result)
    })

    // delete the menu item

    app.delete('/menu/:id', verifyToken, verifyAdmin, async(req, res)=> {

      const id = req.params.id

      const query = {
        _id : new ObjectId(id)
      }

      const result = await menuCollection.deleteOne(query)

      res.send(result)



    })

    // get  the menu item for updating

    app.get('/menu/:id', async(req, res)=> {

      const id = req.params.id

      const query = {
        _id : new ObjectId(id)
      }

      const result = await menuCollection.findOne(query)

      res.send(result)


    })

    // for updating the item 

    app.patch('/menu/:id', async(req, res)=> {
      const id = req.params.id

      const item = req.body

      const query = {
        _id : new ObjectId(id)
      }

      const updateDoc = {

        $set : {

          name : item.name,
          category : item.category,
          price : item.price,
          recipe : item.recipe,
          image : item.image



        }
      }


    const result  = await menuCollection.updateOne(query, updateDoc)

    res.send(result)

    

    })

    // payment intent

    app.post('/create-payment-intent', async(req, res) => {

      const {price} = req.body
      const amount = parseInt(price * 100)

      console.log( 'amount inside intent', amount)

      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency : 'usd',
        payment_method_types : ['card']
      })


      res.send({
        clientSecret: paymentIntent.client_secret
      })


       
    })

    // payment save

    app.post('/payments', async(req, res)=> {

      const payment = req.body

    const paymentResult = await paymentCollection.insertOne(payment)

    // carefully delete each item from the cart

    const query = {
      _id : {
        $in : payment.cartId.map(id => new ObjectId(id) )
      }
    }

    const deleteResult = await cartCollection.deleteMany(query)

    res.send(paymentResult)



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