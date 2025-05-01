import { EventEmitter } from "events";
import { Twilio } from "twilio";
import { ConversationManager } from "../conversation/conversationManager";
// This is a simplified interface for demo purposes
// In a real implementation, you would integrate with a specific provider like Twilio, Vonage, etc.
export interface TelephonyProvider {
  makeCall(phoneNumber: string): Promise<string>; // Returns callId
  endCall(callId: string): Promise<void>;
  say(callId: string, text: string): Promise<void>;
  listen(callId: string): Promise<void>;
  
}

export class TelephonyService extends EventEmitter {
  private provider: TelephonyProvider;
  private activeCallIds: Set<string> = new Set();
  private baseUrl: string;
  private client: Twilio;

  constructor(provider: TelephonyProvider) {
    super();
    // Listen for conversation managers telling us to speak
    this.baseUrl =
    process.env.WEBHOOK_BASE_URL || "https://your-api-endpoint.com";  
    ConversationManager.emitter.on(
      "speak:*",
      async (callId: string, text: string) => {
        // ensure this is our call
        if (!this.activeCallIds.has(callId)) return;
        try {
          await this.client.calls(callId).update({
            url: `${this.baseUrl}/twiml/say?text=${encodeURIComponent(
              text
            )}&callId=${callId}`,
          });
        } catch (err) {
          console.error("Error speaking intro:", err);
        }
      }
    );
    ConversationManager.emitter.on(
      "playAudio:*",
      async (callId: string, audioFile: string) => {
        if (!this.activeCallIds.has(callId)) return;
        try {
          const audioUrl = `${this.baseUrl}/twiml/play?audio=${encodeURIComponent(
            audioFile
          )}&callId=${callId}`;
    
          await this.client.calls(callId).update({ url: audioUrl });
        } catch (err) {
          console.error("Error playing audio:", err);
        }
      }
    );
    
    

    this.provider = provider;


    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async makeCall(phoneNumber: string): Promise<string> {
    try {
      const callId = await this.provider.makeCall(phoneNumber);
      this.activeCallIds.add(callId);

      // Setup event listeners for this call
      this.setupCallEvents(callId);

      return callId;
    } catch (error) {
      console.error("Failed to initiate call:", error);
      throw new Error(`Failed to initiate call to ${phoneNumber}`);
    }
  }

  async speak(callId: string, text: string): Promise<void> {
    const url = `${this.baseUrl}/twiml/say?text=${encodeURIComponent(
      text
    )}&callId=${callId}`;

    try {
      await this.client.calls(callId).update({ url });
    } catch (err: any) {
      if (err.code === 21220) {
        console.warn("Call not in-progress yet, retrying in 1s…");
        await new Promise((r) => setTimeout(r, 1000));
        await this.client.calls(callId).update({ url });
      } else {
        throw err;
      }
    }
  }

  async endCall(callId: string): Promise<void> {
    if (!this.activeCallIds.has(callId)) {
      throw new Error(`No active call with ID: ${callId}`);
    }

    try {
      await this.provider.endCall(callId);
      this.activeCallIds.delete(callId);
      this.emit("callEnded", callId);
    } catch (error) {
      console.error("Failed to end call:", error);
      throw error;
    }
  }

  private setupCallEvents(callId: string): void {
    // In a real implementation, these would be hooked up to the telephony provider's events
    // Example of how you would handle speech input from the customer
    /* 
    this.provider.on('speechDetected', (data: { callId: string, text: string }) => {
      if (data.callId === callId) {
        this.emit('customerSpeech', {
          callId: data.callId,
          text: data.text,
          timestamp: new Date()
        });
      }
    });
    
    this.provider.on('callDropped', (droppedCallId: string) => {
      if (droppedCallId === callId) {
        this.activeCallIds.delete(callId);
        this.emit('callEnded', callId);
      }
    });
    */
  }
  async waitUntilCallIsInProgress(
    callId: string,
    timeoutMs = 10000
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const call = await this.client.calls(callId).fetch();
      if (call.status === "in-progress") return;
      if (
        ["completed", "failed", "busy", "no-answer", "canceled"].includes(
          call.status
        )
      ) {
        throw new Error(`Call ended with status: ${call.status}`);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Timed out waiting for call to become in-progress`);
  }
}
