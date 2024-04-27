const { PubSub } = require("@google-cloud/pubsub");

class GCloudManager {
  constructor() {
    this.pubsub = new PubSub({
      projectId: process.env.PROJECT_ID,
      keyFilename: "./data/leprojetsubv-03afe917999e.json",
    });
  }

  listenForMessages(topicName, subscriptionName, messageHandler, errorHandler) {
    const topic = this.pubsub.topic(topicName);
    const subscription = topic.subscription(subscriptionName);

    subscription.on("message", messageHandler);
    subscription.on("error", errorHandler);

    this.currentSubscription = subscription;
  }

  stopListening() {
    if (this.currentSubscription) {
      this.currentSubscription.removeListener("message", this.messageHandler);
      this.currentSubscription.removeListener("error", this.errorHandler);
      console.log("Stopped listening to messages");
    }
  }

  async publishMessage(topicName, messageBuffer, attributes = {}) {
    const topic = this.pubsub.topic(topicName);
    const messageId = await topic.publishMessage({
      data: messageBuffer,
      attributes: attributes,
    });
    console.log(`Message ${messageId} published.`);
    return messageId;
  }
}

module.exports = GCloudManager;
