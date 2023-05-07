import express from 'express'
import mongoose from 'mongoose'
import Cors from 'cors'
import Messages from './dbMessages.js'
import Pusher from 'pusher'


//App Config
const app = express()
const port = process.env.PORT || 9000
const connection_url = 'mongodb+srv://jmcknight14:p8GvIhPbLck0HQev@messaging-app-mern.nwzxdgl.mongodb.net/?retryWrites=true&w=majority'

const pusher = new Pusher({
    appId: "1596206",
    key: "0852e4c756e556cfdbe9",
    secret: "8ccb4ebc6a3dda844460",
    cluster: "us3",
    useTLS: true
});

//Middleware
app.use(express.json())
app.use(Cors())

//DB Config
mongoose.connect(connection_url, {
})

//API Endpoints
const db = mongoose.connection
db.once("open", () => {
    console.log("DB Connected")
    const msgCollection = db.collection("messagingmessages")
    const changeStream = msgCollection.watch()
    changeStream.on('change', change => {
        console.log(change)
        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        } else {
            console.log('Error trigerring Pusher')
        }
    })
})


app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"))

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage)
        .then((result) => {
            res.status(201).send(result)
        })
        .catch((err) => {
            res.status(500).send(err)
        })
})

app.get('/messages/sync', (req, res) => {
    Messages.find()
        .then((result) => {
            res.status(200).send(result)
        })
        .catch((err) => {
            res.status(500).send(err)
        })
})

//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`))