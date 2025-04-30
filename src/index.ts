import { ConversationManager } from './modules/conversation/conversationManager';
import { TelephonyService } from './modules/telephony/telephonyService';
import { TwilioAdapter } from './modules/telephony/twilioAdapter';
import { getInsuranceAgentConfig } from './config/agentConfig';
import { CustomerInput, LeadStatus } from './models/types';
import twilioWebhooks from './webhooks/twilioWebhooks';
import * as dotenv from 'dotenv';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

// Create Express app for handling webhooks
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.use('/twiml', twilioWebhooks);
// Initialize telephony service
const twilioAdapter = new TwilioAdapter(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
  process.env.TWILIO_PHONE_NUMBER!,
  process.env.TWILIO_TWIML_APP_SID!,

);
const telephonyService = new TelephonyService(twilioAdapter);

// Active conversations map
const activeConversations = new Map<string, ConversationManager>();

// Initialize agent configuration
const agentConfig = getInsuranceAgentConfig(process.env.COMPANY_NAME || 'InsureCo');

// Handles new outbound call requests
app.post('/twiml/status-callback', (req, res) => {
  
  console.log(req.body);
  const { CallSid, CallStatus } = req.body;

  const cm = activeConversations.get(CallSid);
  if (!cm) {
    res.sendStatus(404);
    return;
  }

  if (CallStatus === 'answered') {
    cm.startConversation();
  } else if (CallStatus === 'busy' || CallStatus === 'no-answer') {
    cm.handleNoAnswerOrBusy(CallStatus);
  } else if (CallStatus === 'completed') {
    activeConversations.delete(CallSid);
  }

  res.sendStatus(200);
});

app.post(
    '/api/calls',
    async (req: Request, res: Response): Promise<void> => {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        res.status(400).json({ error: 'Phone number is required' });
        return;
      }
  
      let callId: string;
      try { 
        callId = await telephonyService.makeCall(phoneNumber);
      } catch (err) {
        console.error('Error initiating call:', err);
        res.status(500).json({ error: 'Failed to initiate call' });
        return;
      }
  
      // Create and store the manager
      const cm = new ConversationManager(callId, phoneNumber, agentConfig);
      activeConversations.set(callId, cm);
      
      // RESPOND IMMEDIATELY
      res.status(201).json({ callId });
  
      // --- now do the intro in the background ---
      // (async () => {
      //   try {
      //     // empty text triggers your “greeting” logic
      //     const intro = await cm.processCustomerInput({
      //       text: ``,
      //       timestamp: new Date(),
      //       callId,
      //     });
      //     console.log({intro})          // wait a bit to ensure the call is actually in-progress
      //     await new Promise((r) => setTimeout(r, 4000));
  
      //     await telephonyService.speak(callId, intro);
      //   } catch (bgErr) {
      //     console.error('🔥 Background intro error:', bgErr);
      //   }
      // })();
    }
  );
  
// Handles incoming speech from the customer
app.post('/api/calls/:callId/customerSpeech', async (req: Request, res: Response): Promise<void> => {
    try {
      const { callId } = req.params;
      const { text } = req.body;
  
      if (!text) {
        res.status(400).json({ error: 'Speech text is required' });
        return;
      }
  
      const conversationManager = activeConversations.get(callId);
  
      if (!conversationManager) {
        res.status(404).json({ error: 'No active conversation found for this call' });
        return;
      }
  
      // Process customer input
      const customerInput: CustomerInput = {
        text,
        timestamp: new Date(),
        callId
      };
  
      const agentResponse = await conversationManager.processCustomerInput(customerInput);
  
      // Speak the response
      await telephonyService.speak(callId, agentResponse);
  
      // Check if the conversation should end
      const state = conversationManager.getState();
      if (
        state.currentStage === 'CLOSING' ||
        state.leadStatus === LeadStatus.QUALIFIED ||
        state.leadStatus === LeadStatus.NOT_INTERESTED
      ) {
        // End call and cleanup
        await telephonyService.endCall(callId);
        activeConversations.delete(callId);
  
        // Store the lead information
        storeLeadInformation(state);
      }
  
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing customer speech:', error);
      res.status(500).json({ error: 'Failed to process customer speech' });
    }
  });
  

// Webhook for Twilio to notify of speech detected
app.post('/webhooks/speech', (req, res) => {
  const { CallSid, SpeechResult } = req.body;
  
  // Forward to our internal API
  fetch(`http://localhost:${PORT}/api/calls/${CallSid}/customerSpeech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: SpeechResult })
  }).catch(err => console.error('Error forwarding speech webhook:', err));
  
  // Respond to Twilio
  res.status(200).send('OK');
});

// Helper function to store lead information
function storeLeadInformation(state: any) {
  // This would connect to your CRM or database
  console.log('Storing lead information:', {
    callId: state.callId,
    customerPhone: state.customer.phoneNumber,
    customerName: state.customer.name,
    leadStatus: state.leadStatus,
    timestamp: new Date()
  });
  
  // TODO: Implement actual storage logic
}


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // End all active calls
  for (const [callId] of activeConversations) {
    try {
      await telephonyService.endCall(callId);
    } catch (error) {
      console.error(`Error ending call ${callId}:`, error);
    }
  }
  
  // Clear active conversations
  activeConversations.clear();
  
  // Exit process
  process.exit(0);
});