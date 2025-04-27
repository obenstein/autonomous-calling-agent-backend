import { Schema, model, Document, connect } from 'mongoose';
import { ConversationState, LeadStatus, ConversationStage, CustomerInput, AnalysisResult } from '../models/types';

// Lead Document interface
export interface ILead extends Document {
  callId: string;
  customerPhone: string;
  customerName?: string;
  status: LeadStatus;
  industry: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
  conversation: {
    stage: ConversationStage;
    interactions: {
      customerInput: string;
      timestamp: Date;
      sentiment: string;
      intent: string;
      agentResponse: string;
    }[];
  };
  notes?: string;
  assignedTo?: string;
  followUpDate?: Date;
}

// Lead Schema
const LeadSchema = new Schema({
  callId: { type: String, required: true, unique: true },
  customerPhone: { type: String, required: true },
  customerName: { type: String },
  status: { 
    type: String, 
    enum: Object.values(LeadStatus),
    default: LeadStatus.IN_PROGRESS 
  },
  industry: { type: String, required: true },
  companyName: { type: String, required: true },
  conversation: {
    stage: { 
      type: String, 
      enum: Object.values(ConversationStage),
      default: ConversationStage.INTRODUCTION 
    },
    interactions: [{
      customerInput: { type: String },
      timestamp: { type: Date, default: Date.now },
      sentiment: { type: String },
      intent: { type: String },
      agentResponse: { type: String }
    }]
  },
  notes: { type: String },
  assignedTo: { type: String },
  followUpDate: { type: Date }
}, {
  timestamps: true
});

// Create model
export const Lead = model<ILead>('Lead', LeadSchema);

// Call Analytics Schema
export interface ICallAnalytics extends Document {
  callId: string;
  industry: string;
  companyName: string;
  date: Date;
  duration: number;
  leadStatus: LeadStatus;
  customerSentiments: string[];
  conversionSuccessful: boolean;
  objectionTypes: string[];
  commonQuestions: string[];
}

const CallAnalyticsSchema = new Schema({
  callId: { type: String, required: true, unique: true },
  industry: { type: String, required: true },
  companyName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  duration: { type: Number, required: true }, // in seconds
  leadStatus: { 
    type: String, 
    enum: Object.values(LeadStatus),
    required: true 
  },
  customerSentiments: [{ type: String }],
  conversionSuccessful: { type: Boolean, default: false },
  objectionTypes: [{ type: String }],
  commonQuestions: [{ type: String }]
});

export const CallAnalytics = model<ICallAnalytics>('CallAnalytics', CallAnalyticsSchema);
