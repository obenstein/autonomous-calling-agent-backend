import express from 'express';
const VoiceResponse= require('twilio').twiml.VoiceResponse;
const router = express.Router();

// Starting a call
router.post('/twiml/start', (req, res) => {
  const twiml = new VoiceResponse();
  
  // You can customize this initial greeting
  twiml.say({
    voice: 'Polly.Amy-Neural', // Use a neural voice for better quality
    language: 'en-US'
  }, 'Hello! This is a call from your AI agent system.');
  
  // After greeting, we'll listen for input
  twiml.redirect(`/twiml/listen?callId=${req.query.callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Speaking to the caller
router.post('/twiml/say', (req, res) => {
  const twiml = new VoiceResponse();
  const text = req.query.text as string;
  const callId = req.query.callId as string;
  
  twiml.say({
    voice: 'Polly.Amy-Neural',
    language: 'en-US'
  }, text);
  
  // After speaking, listen for response
  twiml.redirect(`/twiml/listen?callId=${callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Listening to the caller
router.post('/twiml/listen', (req, res) => {
  const twiml = new VoiceResponse();
  const callId = req.query.callId as string;
  
  // Use Twilio's speech recognition
  const gather = twiml.gather({
    input: 'speech',
    speechTimeout: 'auto',
    language: 'en-US',
    enhanced: 'true', // Use enhanced speech recognition
    actionOnEmptyResult: 'true',
    action: `/speech-result?callId=${callId}`,
    method: 'POST'
  });
  
  // Adding a short prompt is optional
  // gather.say('I\'m listening...');
  
  // If no input is received, we can specify a timeout action
  twiml.redirect(`/twiml/timeout?callId=${callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle speech recognition results
router.post('/speech-result', (req, res) => {
  const callId = req.query.callId as string;
  const speechResult = req.body.SpeechResult;
  
  // Process the speech result
  // Here you would integrate with your AI agent system
  console.log(`Received speech from call ${callId}: ${speechResult}`);
  
  // For demo purposes, just echo back what was heard
  const twiml = new VoiceResponse();
  twiml.say({
    voice: 'Polly.Amy-Neural',
    language: 'en-US'
  }, `I heard you say: ${speechResult}`);
  
  twiml.redirect(`/twiml/listen?callId=${callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle timeout (no speech detected)
router.post('/twiml/timeout', (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say({
    voice: 'Polly.Amy-Neural',
    language: 'en-US'
  }, 'I didn\'t hear anything. Let me know if you need assistance.');
  
  twiml.redirect(`/twiml/listen?callId=${req.query.callId}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

export default router;