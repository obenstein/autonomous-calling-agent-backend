import {
  ConversationState,
  CustomerInput,
  AnalysisResult,
  ConversationStage,
  LeadStatus,
  AgentConfig,
  Entity,
  Intent,
  Sentiment,
  AnalysisResultForAudio,
} from "../../models/types";
import nlp from "compromise";
import { SentimentAnalyzer } from "../analysis/sentimentAnalyzer";
import { ResponseGenerator } from "../response/responseGenerator";
import { LeadQualifier } from "../qualification/leadQualifier";
//import { audioLibrary } from "../../utils/audioLibrary/audioLibrary";
import { AudioLibrary } from "../../utils/audioLibrary/audioLibrary";
export class ConversationManager {
  private state: ConversationState;
  private sentimentAnalyzer: SentimentAnalyzer;
  private responseGenerator: ResponseGenerator;
  private leadQualifier: LeadQualifier;

  constructor(callId: string, customerPhone: string, config: AgentConfig) {
    this.state = {
      callId,
      customer: {
        phoneNumber: customerPhone,
      },
      history: [],
      currentStage: ConversationStage.INTRODUCTION,
      leadStatus: LeadStatus.IN_PROGRESS,
      nextAction: "introduce",
    };

    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.responseGenerator = new ResponseGenerator(config);
    this.leadQualifier = new LeadQualifier(config.qualificationCriteria);
  }
  
  
  async processCustomerInput(input: CustomerInput): Promise<string> {
    // Analyze customer input
    // const analysis = await this.sentimentAnalyzer.analyze(input);
    const category = this.categorizeInput(input);
    console.log("🔍 Category:", category);
    // Update conversation state based on analysis
    this.updateState(category);

    // Determine next action based on updated state

    // console.log("🤖 Agent response:", agentResponse);
    // Add response to history
    // this.state.history.push({
    //   analysis,
    // });
    const audioClip = AudioLibrary.getAudioPath(this.state.nextAction);
    if (audioClip) {
      console.log({audioClip});
      this.emitAudio(audioClip);
    } else {
      this.emitSpeak(input.text); // fallback to TTS
    }
    return input.text;
  }

  private updateState(category: string): void {
    // Update customer info if entities contain relevant information
    // this.extractCustomerInfo(analysis);
    if (category) {
      this.state.nextAction = category;
    }
    // Determine next conversation stage
    this.determineNextStage(category);

    // Update lead qualification status
    // this.updateLeadStatus(analysis);
  }

  private extractCustomerInfo(entities: Entity[]): void {
    // Extract customer name and other info from entities
    const nameEntity = entities.find((e) => e.type === "PERSON");
    if (nameEntity && !this.state.customer.name) {
      this.state.customer.name = nameEntity.value;
    }

    // Extract other relevant information
    // ...
  }
    private determineNextStage(category: string): void {
      const actionMap: Record<
        string,
        { stage: ConversationStage; nextAction: string }
      > = {
        introduce: {
          stage: ConversationStage.INTRODUCTION,
          nextAction: "introduce",
        },
        qualify: {
          stage: ConversationStage.QUALIFICATION,
          nextAction: "ask_qualification_questions",
        },
        address_objection: {
          stage: ConversationStage.ADDRESSING_OBJECTIONS,
          nextAction: "handle_objection",
        },
        confirm_interest: {
          stage: ConversationStage.INTEREST_CONFIRMATION,
          nextAction: "confirm_customer_interest",
        },
        schedule_followup: {
          stage: ConversationStage.CLOSING,
          nextAction: "schedule_followup",
        },
        respect_rejection: {
          stage: ConversationStage.CLOSING,
          nextAction: "respect_rejection",
        },
        thank_and_close: {
          stage: ConversationStage.CLOSING,
          nextAction: "thank_and_close",
        },
      };

      const action = category.toLowerCase();

      const mapped = actionMap[action];

      if (mapped) {
        this.state.currentStage = mapped.stage;
        this.state.nextAction = mapped.nextAction;
      } else {
        // Fallback if action is unrecognized
        console.warn(`Unrecognized action category: ${action}`);
        this.state.currentStage = ConversationStage.CLOSING;
        this.state.nextAction = "default_close";
      }
    }
   categorizeInput(input: CustomerInput): string {
      const lowered = input.text.toLowerCase();
    
      if (/(hi|hello|hey|good|how|are|you|introduce (morning|afternoon|evening))/.test(lowered)) {
        return "introduce";
      }
    
      if (/(interested|tell me more|sounds good|i want|okay|sure|go ahead|yes)/.test(lowered)) {
        return "confirm_interest";
      }
    
      if (/(not interested|no thanks|don't want|stop|leave me alone)/.test(lowered)) {
        return "respect_rejection";
      }
    
      if (/(price|cost|expensive|discount|too much|budget)/.test(lowered)) {
        return "address_objection";
      }
    
      if (/(book|schedule|call back|follow up|another time|later)/.test(lowered)) {
        return "schedule_followup";
      }
    
      if (/(thanks|thank you|bye|goodbye)/.test(lowered)) {
        return "thank_and_close";
      }
    
      return "greet"; // Fallback default
    }
    
  private updateLeadStatus(analysis: AnalysisResult): void {
    // Update lead qualification status based on analysis and conversation history
    const qualification = this.leadQualifier.qualifyLead(this.state, analysis);
    this.state.leadStatus = qualification;
  }

  public getState(): ConversationState {
    return this.state;
  }
  public async startConversation(): Promise<void> {
    try {
      const intro = await this.processCustomerInput({
        text: "",
        timestamp: new Date(),
        callId: this.state.callId,
      });
      // emit an event so TelephonyService can speak
      this.emitSpeak(intro);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  }
  public handleNoAnswerOrBusy(status: string) {
    console.warn(`Call ${this.state.callId} ended with status ${status}`);
    this.state.leadStatus = LeadStatus.UNQUALIFIED;
    // TODO: persist this outcome to your DB
  }
  private emitSpeak(text: string) {
    // You could also @Inject TelephonyService, but here:
    ConversationManager.emitter.emit(`speak:${this.state.callId}`, text);
  }
  private emitAudio(audioClipUrl: string) {
    ConversationManager.emitter.emit(
      `playAudio:${this.state.callId}`,
      audioClipUrl
    );
  }

  public static emitter = new (require("events").EventEmitter)();
}
