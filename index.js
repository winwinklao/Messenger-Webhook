// require("dotenv").config();
"use strict";

// const MY_VERIFY_TOKEN = process.env.MY_VERIFY_TOKEN;

// Imports dependencies and set up http server
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Creates the endpoint for our webhook
app.post("/webhook", (req, res) => {
  let body = req.body;
  // Checks this is an event from a page subscription

  // console.log(body);
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  // let VERIFY_TOKEN = MY_VERIFY_TOKEN;
  // const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  let VERIFY_TOKEN =
    "EAANrNDfvfjsBAF6u8DFJoj1fqg7wwhNh5tbUh8uV1ZCgPhxmhTqFTUeVJjMDZBNiK4XZAESFZBTTHyG9JGpvtDrzWfRukgOZAi6kngZCFaIZAarZB10WH3FXL8SSTUQQgCWWGE5uk1Gj5EGcOSPN50hNMTOBgWltKWRxe1ZA0dYZADq8xUGld1wfraSyxgMxkWemIZD";
  // "EAAGkCZBeyZAMkBAAAX1aNIn3HITuVvdTjqotuZADQja5FjN31FddEGKZBRIWxO5mj4bImB2LAgvoMmBRZCW3QH1MqZAnjHskkPL3EzNMJZAYWPVun0ByAXDehFyEu3Dl7lnYHL4oczPh9GB56M2inVoDGMeZChCiKMU0BQRhAnn4QTlH0W5pOvh2SG1R2zLZALLFYyrVj7vpC7gZDZD";
  // const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  // const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
  // quickReplies();
});

const request = require("request");
const images = require("./pics");

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

  // Check if the message contains text
  if (received_message.text) {
    // quickReplies();
    // Create the payload for a basic text message
    if (received_message.text == "Animal") {
      response = askTemplate("Are you a Cat or Dog Person?");
    } else if (received_message.text == "Theomelet") {
      response = askButtonTemplate("The Omelet Co., Ltd.");
    } else if (received_message.text == "testQ") {
      response = askQuickReplies();
    } else if (received_message.text == "Get start") {
      response = askQuickRepliesGetStart();
    } else if (received_message.text == "Yes") {
      response = {
        text: `:)`,
      };
    } else if (received_message.text == "No") {
      response = {
        text: `We are The Omelet :)`,
      };
    } else if (received_message.text == "Red") {
      response = {
        text: `REDDDDDDDDD :)`,
      };
    } else if (received_message.text == "Green") {
      response = {
        text: `GREENNNNNNN :P`,
      };
    } else {
      response = {
        text: `You sent the message: "${received_message.text}". Now send me an image!`,
      };
    }
  } else if (received_message.attachments) {
    // Gets the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this the right picture?",
              subtitle: "Tap a button to answer.",
              image_url: attachment_url,
              buttons: [
                {
                  type: "postback",
                  title: "Yes!",
                  payload: "yes",
                },
                {
                  type: "postback",
                  title: "No!",
                  payload: "no",
                },
              ],
            },
          ],
        },
      },
    };
  }
  // Sends the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "yes") {
    response = { text: "Thanks!" };
  } else if (payload === "no") {
    response = { text: "Oops, try sending another image." };
  } else if (payload === "CAT_PICS") {
    response = imageTemplate("cats", sender_psid);
  } else if (payload === "DOG_PICS") {
    response = imageTemplate("dogs", sender_psid);
  } else if (payload === "GET_STARTED") {
    response = askQuickRepliesGetStart();
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: {
        access_token:
          "EAANrNDfvfjsBAIKqnmSme5ieUZBNtnUtNohhV2M8wPdn11ZAO56SBSy7iabPrI4pUZBtnExT0GHNErJ0zor1Ig6JujHmrZADwxolzHnxwZB7fJJJUhE3YuO7dZC2Sz6k3ZAIEdvZBBLWrfFsIZCXnf8q5BAO1WALuCqajFpZAsjuFZAceKuWZBZCV9GgO50Qgd65kZBugZD",
      },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

const askTemplate = (text) => {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: text,
        buttons: [
          {
            type: "postback",
            title: "Cats",
            payload: "CAT_PICS",
          },
          {
            type: "postback",
            title: "Dogs",
            payload: "DOG_PICS",
          },
        ],
      },
    },
  };
};

const askButtonTemplate = (text) => {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: text,
        buttons: [
          {
            type: "web_url",
            url: "https://www.theomelet.co/",
            title: "WEBVIEW",
          },
          {
            type: "web_url",
            url: "https://www.facebook.com/theomeletco",
            title: "FACEBOOKVIEW",
          },
        ],
      },
    },
  };
};


function askQuickRepliesGetStart() {
  return {
    text: "Welcome!!! Do you know us?",
    quick_replies: [
      {
        content_type: "text",
        title: "Yes",
        payload: "",
        image_url:
          "https://cdn.pixabay.com/photo/2012/04/11/12/08/check-mark-27820_960_720.png",
      },
      {
        content_type: "text",
        title: "No",
        payload: "",
        image_url: "https://cdn.pixabay.com/photo/2012/04/02/16/06/error-24842_960_720.png",
      },
    ],
  };
}

function askQuickReplies() {
  return {
    text: "Pick a color:",
    quick_replies: [
      {
        content_type: "text",
        title: "Red",
        payload: "RED_COLOR",
        image_url:
          "https://e1.pngegg.com/pngimages/992/794/png-clipart-cercle-point-rouge-ligne-zone-ovale-symbole.png",
      },
      {
        content_type: "text",
        title: "Green",
        payload: "GREEN_COLOR",
        image_url: "https://www.emojiall.com/images/60/skype/1f7e2.png",
      },
    ],
  };
}


const imageTemplate = (type, sender_id) => {
  return {
    attachment: {
      type: "image",
      payload: {
        url: getImage(type, sender_id),
        is_reusable: true,
      },
    },
  };
};

let users = {};

const getImage = (type, sender_id) => {
  // create user if doesn't exist
  if (users[sender_id] === undefined) {
    users = Object.assign(
      {
        [sender_id]: {
          cats_count: 0,
          dogs_count: 0,
        },
      },
      users
    );
  }

  let count = images[type].length, // total available images by type
    user = users[sender_id], // // user requesting image
    user_type_count = user[type + "_count"];

  // update user before returning image
  let updated_user = {
    [sender_id]: Object.assign(user, {
      [type + "_count"]:
        count === user_type_count + 1 ? 0 : user_type_count + 1,
    }),
  };
  // update users
  users = Object.assign(users, updated_user);

  console.log(users);
  return images[type][user_type_count];
};
