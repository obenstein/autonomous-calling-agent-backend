export interface CustomerInput {
    text: string;
    timestamp: Date;
    callId: string;
  }
  
  export interface AnalysisResult {
    input: CustomerInput;
    sentiment: Sentiment;
    intent: Intent;
    entities: Entity[];
    confidenceScore: number;
  }
export interface AnalysisResultForAudio{
  nextActionCategory: string;
}
  
  export enum Sentiment {
    POSITIVE = 'POSITIVE',
    NEUTRAL = 'NEUTRAL',
    NEGATIVE = 'NEGATIVE',
    INTERESTED = 'INTERESTED',
    NOT_INTERESTED = 'NOT_INTERESTED',
    NEED_MORE_INFO = 'NEED_MORE_INFO',
  }
  
  export enum Intent {
    GREETING = 'GREETING',
    INQUIRY = 'INQUIRY',
    REJECTION = 'REJECTION',
    INTEREST = 'INTEREST',
    QUESTION = 'QUESTION',
    OBJECTION = 'OBJECTION',
    UNAVAILABLE = 'UNAVAILABLE',
    OTHER = 'OTHER',
  }
  
  export interface Entity {
    type: string;
    value: string;
    position: [number, number]; // Start, end indices
  }
  
  export interface ConversationState {
    callId: string;
    customer: {
      name?: string;
      phoneNumber: string;
      previousInteractions?: string[];
    };
    history: {
      input: CustomerInput;
      analysis: AnalysisResult;
      // agentResponse: string;
    }[];
    currentStage: ConversationStage;
    leadStatus: LeadStatus;
    nextAction: string;
  }
  
  export enum ConversationStage {
    INTRODUCTION = 'INTRODUCTION',
    QUALIFICATION = 'QUALIFICATION',
    ADDRESSING_OBJECTIONS = 'ADDRESSING_OBJECTIONS',
    INTEREST_CONFIRMATION = 'INTEREST_CONFIRMATION',
    CLOSING = 'CLOSING',
  }
  
  export enum LeadStatus {
    UNQUALIFIED = 'UNQUALIFIED',
    IN_PROGRESS = 'IN_PROGRESS',
    QUALIFIED = 'QUALIFIED',
    NOT_INTERESTED = 'NOT_INTERESTED',
    CALL_BACK_LATER = 'CALL_BACK_LATER',
    NEEDS_HUMAN_FOLLOWUP = 'NEEDS_HUMAN_FOLLOWUP',
  }
  
  export interface AgentConfig {
    companyName: string;
    industry: string;
    productInfo: ProductInfo;
    scriptTemplates: Record<ConversationStage, string[]>;
    qualificationCriteria: QualificationCriteria;
  }
  
  export interface ProductInfo {
    name: string;
    keyFeatures: string[];
    benefits: string[];
    targetCustomers: string[];
  }
  
  export interface QualificationCriteria {
    minimumInterestLevel: number;
    requiredCustomerAttributes: Record<string, any>;
    disqualifyingFactors: string[];
  }
  