import { ConversationState, AnalysisResult, LeadStatus, QualificationCriteria, Sentiment, Intent } from '../../models/types';

export class LeadQualifier {
  private criteria: QualificationCriteria;
  
  constructor(criteria: QualificationCriteria) {
    this.criteria = criteria;
  }
  
  qualifyLead(state: ConversationState, latestAnalysis: AnalysisResult): LeadStatus {
    // Track sentiment over time
    const sentimentHistory = state.history.map(h => h.analysis.sentiment);
    sentimentHistory.push(latestAnalysis.sentiment);
    
    // Calculate interest level based on sentiment history
    const interestLevel = this.calculateInterestLevel(sentimentHistory);
    
    // Check for disqualifying factors
    if (this.hasDisqualifyingFactors(state, latestAnalysis)) {
      return LeadStatus.UNQUALIFIED;
    }
    
    // Check explicit rejection
    if (latestAnalysis.intent === Intent.REJECTION || 
        latestAnalysis.sentiment === Sentiment.NOT_INTERESTED) {
      return LeadStatus.NOT_INTERESTED;
    }
    
    // Check for call back request
    if (this.containsCallBackRequest(latestAnalysis)) {
      return LeadStatus.CALL_BACK_LATER;
    }
    
    // Check for human escalation need
    if (this.needsHumanFollowup(state, latestAnalysis)) {
      return LeadStatus.NEEDS_HUMAN_FOLLOWUP;
    }
    
    // Check qualification based on interest level
    if (interestLevel >= this.criteria.minimumInterestLevel) {
      return LeadStatus.QUALIFIED;
    }
    
    // Default - still in progress
    return LeadStatus.IN_PROGRESS;
  }
  
  private calculateInterestLevel(sentimentHistory: Sentiment[]): number {
    // Weight more recent sentiments higher
    let interestLevel = 0;
    let totalWeight = 0;
    
    sentimentHistory.forEach((sentiment, index) => {
      const weight = index + 1; // More recent = higher weight
      totalWeight += weight;
      
      switch (sentiment) {
        case Sentiment.INTERESTED:
          interestLevel += weight * 1.0;
          break;
        case Sentiment.POSITIVE:
          interestLevel += weight * 0.8;
          break;
        case Sentiment.NEED_MORE_INFO:
          interestLevel += weight * 0.6;
          break;
        case Sentiment.NEUTRAL:
          interestLevel += weight * 0.4;
          break;
        case Sentiment.NEGATIVE:
          interestLevel += weight * 0.2;
          break;
        case Sentiment.NOT_INTERESTED:
          interestLevel += weight * 0.0;
          break;
      }
    });
    
    return interestLevel / totalWeight; // Normalize to 0-1 range
  }
  
  private hasDisqualifyingFactors(state: ConversationState, analysis: AnalysisResult): boolean {
    // Check for disqualifying factors in conversation history and entities
    for (const factor of this.criteria.disqualifyingFactors) {
      // Check if factor appears in latest input
      if (analysis.entities.some(e => e.value && e.value.toLowerCase().includes(factor.toLowerCase()))) {
        return true;
      }
      
      // Check in conversation history
      if (state.history.some(h => 
        h.input.text.toLowerCase().includes(factor.toLowerCase())
      )) {
        return true;
      }
    }
    
    return false;
  }
  
  private containsCallBackRequest(analysis: AnalysisResult): boolean {
    // Check for call back requests in the entities and intent
    const callBackPhrases = ['call back', 'call later', 'another time', 'not now', 'busy'];
    
    return analysis.entities.some(e => 
      e.value && callBackPhrases.some(phrase => e.value.toLowerCase().includes(phrase))
    );
    
  }
  
  private needsHumanFollowup(state: ConversationState, analysis: AnalysisResult): boolean {
    // Determine if the conversation needs human intervention
    
    // Check if conversation is getting too complex
    if (state.history.length > 10) {
      const recentSentiments = state.history.slice(-3).map(h => h.analysis.sentiment);
      // If recent sentiments are mixed or confusing, escalate
      const uniqueSentiments = new Set(recentSentiments);
      if (uniqueSentiments.size >= 3) {
        return true;
      }
    }
    
    // Check for explicit request for human
    const humanRequestPhrases = ['speak to a person', 'real person', 'human', 'manager', 'supervisor', 'representative'];
    
    if (humanRequestPhrases.some(phrase => analysis.input.text.toLowerCase().includes(phrase))) {
      return true;
    }
    
    // Check for very low confidence scores
    if (analysis.confidenceScore < 0.4) {
      return true;
    }
    
    return false;
  }
}