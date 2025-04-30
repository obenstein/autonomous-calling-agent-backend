import express from 'express';
import dotenv from 'dotenv';
import { ConversationManager } from '../modules/conversation/conversationManager';
import { getInsuranceAgentConfig } from '../config/agentConfig';
const VoiceResponse= require('twilio').twiml.VoiceResponse;
const router = express.Router();
dotenv.config();
const BASE_URL = `${process.env.WEBHOOK_BASE_URL}/twiml`;
const agentConfig = getInsuranceAgentConfig(process.env.COMPANY_NAME || 'InsureCo');
const activeConversations = new Map<string, ConversationManager>();

// Starting a call
router.post('/start', (req, res) => {
  const twiml = new VoiceResponse();


  // You can customize this initial greeting
  twiml.say('Hello! This is a call from your AI agent system.');
  twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    action: `${BASE_URL}/continue`,
    method: 'POST'
  });
  // After greeting, we'll listen for input
  twiml.redirect(`${BASE_URL}/listen?callId=${req.query.callId}`);
  
  res.type('text/xml').send(twiml.toString());  
  console.log("xml here", twiml.toString());
}); 

// Speaking to the caller
router.post('/say', (req, res) => {
  const twiml = new VoiceResponse();
  const text = req.query.text as string;
  const callId = req.query.callId as string;
  
  twiml.say({
    voice: 'Polly.Amy-Neural',
    language: 'en-US'
  }, text);
  
  // After speaking, listen for response
  twiml.redirect(`${BASE_URL}/listen?callId=${callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Listening to the caller
router.post('/listen', (req, res) => {
  const twiml = new VoiceResponse();
  const callId = req.query.callId as string;
  
  // Use Twilio's speech recognition
  const gather = twiml.gather({
    input: 'speech',
    speechTimeout: 'auto',
    language: 'en-US',
    enhanced: 'true', // Use enhanced speech recognition
    actionOnEmptyResult: 'true',
    action: `${BASE_URL}/speech-result?callId=${callId}`,
    method: 'POST'
  });
  
  // Adding a short prompt is optional
  // gather.say('I\'m listening...');
  
  // If no input is received, we can specify a timeout action
  twiml.redirect(`${BASE_URL}/timeout?callId=${callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle speech recognition results
router.post('/speech-result', async (req, res) => {
  const callId = req.query.callId as string;
  const speechResult = req.body?.SpeechResult ?? '';
  const phoneNumber = req.body.From;
  // Process the speech result
  // Here you would integrate with your AI agent system
   const cm = new ConversationManager(callId, phoneNumber, agentConfig);
    activeConversations.set(callId, cm);
  
  const agentResponse = await cm.processCustomerInput(speechResult);

  console.log(`Received speech from call ${callId}: ${speechResult}`);
  console.log(`agent Response ${callId}: ${agentResponse}`);

  
  // For demo purposes, just echo back what was heard
  const twiml = new VoiceResponse();
  twiml.say({
    voice: 'Polly.Amy-Neural',
    language: 'en-US'
  }, `${agentResponse}`);
  
  twiml.redirect(`${BASE_URL}/listen?callId=${callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle timeout (no speech detected)
router.post('/timeout', (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say({
    voice: 'Polly.Amy-Neural',
    language: 'en-US'
  }, 'I didn\'t hear anything. Let me know if you need assistance.');
  
  twiml.redirect(`${BASE_URL}/listen?callId=${req.query.callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;