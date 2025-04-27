// src/db/leadRepository.ts
import { ConversationState, LeadStatus } from '../models/types';
import { Lead, ILead, CallAnalytics, ICallAnalytics } from './models';

export class LeadRepository {
  /**
   * Initialize a new Lead in the database at the start of a call
   */
  async createLead(callId: string, customerPhone: string, industry: string, companyName: string): Promise<ILead> {
    const newLead = new Lead({
      callId,
      customerPhone,
      status: LeadStatus.IN_PROGRESS,
      industry,
      companyName,
      conversation: {
        stage: 'INTRODUCTION',
        interactions: []
      }
    });
    
    return await newLead.save();
  }
  
  /**
   * Update lead with conversation state after call completion
   */
  async updateLeadFromConversationState(state: ConversationState): Promise<ILead | null> {
    const lead = await Lead.findOne({ callId: state.callId });
    
    if (!lead) {
      console.error(`Lead not found for call ID: ${state.callId}`);
      return null;
    }
    
    // Update lead properties
    lead.customerName = state.customer.name;
    lead.status = state.leadStatus;
    
    // Map conversation interactions
    lead.conversation.stage = state.currentStage;
    lead.conversation.interactions = state.history.map(h => ({
      customerInput: h.input.text,
      timestamp: h.input.timestamp,
      sentiment: h.analysis.sentiment,
      intent: h.analysis.intent,
      agentResponse: h.agentResponse
    }));
    
    // Set follow-up date if qualified
    if (state.leadStatus === LeadStatus.QUALIFIED) {
      // Default to next business day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      lead.followUpDate = tomorrow;
    }
    
    return await lead.save();
  }
  
  /**
   * Store analytics data after call completion
   */
//   async storeCallAnalytics(state: ConversationState, duration: number): Promise<ICallAnalytics> {
//     // Extract sentiments from conversation history
//     const customerSentiments = state.history.map(h => h.analysis.sentiment);
    
//     // Identify objections
//     const objectionTypes = state.history
//       .filter(h => h.analysis.intent.includes('objection'))
//       .map(h => h.analysis.objectionType || 'general');
    
//     // Extract questions for analysis
//     const commonQuestions = state.history
//       .filter(h => h.analysis.intent.includes('question'))
//       .map(h => h.input.text);
    
//     const analytics = new CallAnalytics({
//       callId: state.callId,
//       industry: state.industry,
//       companyName: state.companyName,
//       duration,
//       leadStatus: state.leadStatus,
//       customerSentiments,
//       conversionSuccessful: state.leadStatus === LeadStatus.QUALIFIED,
//       objectionTypes,
//       commonQuestions
//     });
    
//     return await analytics.save();
//   }
  
  /**
   * Get all leads with specific status
   */
  async getLeadsByStatus(status: LeadStatus): Promise<ILead[]> {
    return await Lead.find({ status }).sort({ updatedAt: -1 });
  }
  
  /**
   * Get leads that need follow-up today
   */
  async getLeadsForFollowUp(): Promise<ILead[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await Lead.find({
      status: LeadStatus.QUALIFIED,
      followUpDate: {
        $gte: today,
        $lt: tomorrow
      }
    });
  }
  
  /**
   * Update lead status
   */
  async updateLeadStatus(callId: string, status: LeadStatus): Promise<ILead | null> {
    return await Lead.findOneAndUpdate(
      { callId },
      { $set: { status } },
      { new: true }
    );
  }
  
  /**
   * Add a note to a lead
   */
  async addNoteToLead(callId: string, note: string): Promise<ILead | null> {
    const lead = await Lead.findOne({ callId });
    
    if (!lead) {
      return null;
    }
    
    lead.notes = lead.notes ? `${lead.notes}\n${note}` : note;
    return await lead.save();
  }
  
  /**
   * Assign lead to an agent
   */
  async assignLead(callId: string, agentId: string): Promise<ILead | null> {
    return await Lead.findOneAndUpdate(
      { callId },
      { $set: { assignedTo: agentId } },
      { new: true }
    );
  }
  
  /**
   * Get analytics for a specific industry
   */
  async getIndustryAnalytics(industry: string): Promise<any> {
    const analytics = await CallAnalytics.find({ industry });
    
    // Calculate conversion rate
    const totalCalls = analytics.length;
    const successfulCalls = analytics.filter(a => a.conversionSuccessful).length;
    const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    
    // Get common objections
    const allObjections = analytics.flatMap(a => a.objectionTypes);
    const objectionCounts = allObjections.reduce((acc, obj) => {
      acc[obj] = (acc[obj] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get common questions
    const allQuestions = analytics.flatMap(a => a.commonQuestions);
    const questionCounts = allQuestions.reduce((acc, q) => {
      acc[q] = (acc[q] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Average call duration
    const totalDuration = analytics.reduce((sum, a) => sum + a.duration, 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    
    return {
      totalCalls,
      successfulCalls,
      conversionRate,
      objectionCounts,
      questionCounts,
      avgDuration
    };
  }
}