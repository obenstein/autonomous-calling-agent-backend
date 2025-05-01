import express from "express";
import dotenv from "dotenv";
import { ConversationManager } from "../modules/conversation/conversationManager";
import { getInsuranceAgentConfig } from "../config/agentConfig";
const VoiceResponse = require("twilio").twiml.VoiceResponse;
const router = express.Router();
dotenv.config();
const BASE_URL = `${process.env.WEBHOOK_BASE_URL}/twiml`;
const agentConfig = getInsuranceAgentConfig(
  process.env.COMPANY_NAME || "InsureCo"
);
const activeConversations = new Map<string, ConversationManager>();

// Starting a call
router.post("/start", (req, res) => {
  const twiml = new VoiceResponse();
  const CallSid = req.body.CallSid;

  // You can customize this initial greeting
  twiml.say("Hello! This is a call from your AI agent system.");
  twiml.gather({
    input: "dtmf",
    numDigits: 1,
    action: `${BASE_URL}/continue`,
    method: "POST",
  });
  // After greeting, we'll listen for input
  twiml.redirect(`${BASE_URL}/listen?callId=${CallSid}`);

  res.type("text/xml").send(twiml.toString());
  console.log("xml here", twiml.toString());
});

// Speaking to the caller
router.post("/say", (req, res) => {
  const twiml = new VoiceResponse();
  const text = req.query.text as string;
  const callId = req.body.CallSid as string;

  twiml.say(
    {
      voice: "Polly.Amy-Neural",
      language: "en-US",
    },
    text
  );

  // After speaking, listen for response
  twiml.redirect(`${BASE_URL}/listen?callId=${callId}`);

  res.type("text/xml");
  res.send(twiml.toString());
});

router.post("/listen", (req, res) => {
  const twiml = new VoiceResponse();
  const callId = req.body.CallSid;

  const gather = twiml.gather({
    input: "speech",
    speechTimeout: "auto",
    language: "en-US",
    enhanced: true,
    actionOnEmptyResult: true,
    action: `${BASE_URL}/speech-result?callId=${callId}`,
    method: "POST",
  });

  // This MUST be inside the gather block!
  gather.say(
    {
      voice: "Polly.Amy-Neural",
      language: "en-US",
    },
    "I'm listening, go ahead."
  );

  // This is only used if gather times out or hears nothing
  twiml.redirect(`${BASE_URL}/timeout?callId=${callId}`);

  res.type("text/xml");
  res.send(twiml.toString());
});

// Handle speech recognition results
router.post("/speech-result", async (req, res) => {
  const callId = req.body.CallSid as string;
  // console.log("Received speech result:", callId, req.body);
  console.log("Received speech result:", callId, req.body);
  const speechResult = req.body?.SpeechResult;
  const phoneNumber = req.body.From;

  // Process the speech result
  // Here you would integrate with your AI agent system
  const cm = new ConversationManager(callId, phoneNumber, agentConfig);
  activeConversations.set(callId, cm);
  if (!speechResult) {
    console.log("No speech result received.");
    res.status(400).send("No speech result received.");
    return;
  }
  const customerInput = {
    text: speechResult,
    timestamp: new Date(),
    callId,
  };
  console.log(`Received speech from call ${callId}: ${speechResult}`);
  const agentResponse = await cm.processCustomerInput(customerInput);

  // For demo purposes, just echo back what was heard
  const twiml = new VoiceResponse();
  twiml.say(
    {
      voice: "Polly.Amy-Neural",
      language: "en-US",
    },
    `${agentResponse}`
  );

  twiml.redirect(`${BASE_URL}/listen?callId=${callId}`);

  res.type("text/xml");
  res.send(twiml.toString());
});

// Handle timeout (no speech detected)
router.post("/timeout", (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say(
    {
      voice: "Polly.Amy-Neural",
      language: "en-US",
    },
    "I didn't hear anything. Let me know if you need assistance."
  );

  twiml.redirect(`${BASE_URL}/listen?callId=${req.body.CallSid}`);

  res.type("text/xml");
  res.send(twiml.toString());
});
router.get("/twiml/play", (req, res) => {
  const audio = req.query.audio as string;

  const response = new VoiceResponse();
  response.play({}, audio); // assumes full public URL

  res.type("text/xml");
  res.send(response.toString());
});

export default router;
