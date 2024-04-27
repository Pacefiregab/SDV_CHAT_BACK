const express = require("express");
const cors = require("cors");
const gcloudController = require("./controller/gcloudController");
const app = express();
const bodyParser = require("body-parser");
const GCloudManager = require("./GCloudManager");
const router = require("./router");
const http = require('http');

/* app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); */


const gcloudManager = new GCloudManager();


const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

const NODE_ENV = process.env.NODE_ENV;
require("dotenv").config({ path: `./.env.${NODE_ENV}` });
const SOCKET_PORT = process.env.SOCKET_PORT;

const topicName = process.env.TOPIC_NAME;
const subscriptionName = process.env.SUBSCRIPTION_NAME;

gcloudManager.listenForMessages(
  topicName,
  subscriptionName,
  (message) => {
    const attributes = (message.attributes);
    const content = message.data.toString();

    const formattedMessage = {
      content,
      attributes,
      receivedAt: new Date(),
    };

    // Print the formatted message to the console
    console.log('Received message: aaaa');
    /* console.log(formattedMessage); */
    message.ack(); // Acknowledge the message to mark it as processed
    io.emit('send-message', formattedMessage); // Broadcast message to all connected clients
  },
  (error) => {
    console.error(`Received error: ${error.message}`);
  }
);

app.use(bodyParser.json());
app.use("/api", router);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

process.on("SIGINT", () => {
  gcloudManager.stopListening();
  process.exit();
});


io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });

  // Handle custom events such as sending and receiving messages
  socket.on('send-message', (data) => {

    console.log('Received message:', data);

    messageToSend = {
      body: {
        topicName: data.topicName,
        message: data.message,
        attributes: data.attributes
      }
    }
    gcloudManager.publishMessage(data.topicName, Buffer.from(data.message), data.attributes);
    // Process and emit the message as needed
    io.emit('message', messageToSend); // Broadcast message to all connected clients
  });

});


server.listen(SOCKET_PORT, () => {
  console.log(`Server running on port ${SOCKET_PORT}`);
});
