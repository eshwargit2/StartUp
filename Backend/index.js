const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const app = require("./Server");

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");
const ownerEmail = defineSecret("OWNER_EMAIL");

exports.api = onRequest(
  {
    region: "asia-south1",
    cors: true,
    secrets: [gmailUser, gmailAppPassword, ownerEmail],
  },
  app
);
