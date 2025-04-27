import { AgentConfig, ConversationStage, ProductInfo, QualificationCriteria } from '../models/types';

// Example insurance-specific configuration
export const getInsuranceAgentConfig = (companyName: string): AgentConfig => {
  const productInfo: ProductInfo = {
    name: 'Comprehensive Auto Insurance',
    keyFeatures: [
      'Accident forgiveness',
      '24/7 roadside assistance',
      'New car replacement',
      'Gap coverage'
    ],
    benefits: [
      'saving an average of $500 per year on premiums',
      'faster claims processing with our mobile app',
      'customized coverage tailored to your specific needs'
    ],
    targetCustomers: [
      'drivers with clean records',
      'families with multiple vehicles',
      'new car owners'
    ]
  };
  
  const qualificationCriteria: QualificationCriteria = {
    minimumInterestLevel: 0.6,
    requiredCustomerAttributes: {
      hasVehicle: true
    },
    disqualifyingFactors: [
      'no car',
      'no license',
      'under 18',
      'not interested',
      'do not call'
    ]
  };
  
  const scriptTemplates: Record<ConversationStage, string[]> = {
    [ConversationStage.INTRODUCTION]: [
      `Hello, my name is Alex from ${companyName}. I'm calling to see if you might be interested in exploring options to save on your auto insurance. Do you have a few minutes to chat?`,
      `Hi there, this is Alex with ${companyName}. We're helping drivers in your area save an average of $500 on their auto insurance. Would you be interested in learning more?`
    ],
    [ConversationStage.QUALIFICATION]: [
      `Great! To find the best coverage options for you, may I ask what kind of vehicle you currently drive?`,
      `Excellent! Just to make sure our insurance options fit your needs, could you tell me about your current auto insurance situation?`
    ],
    [ConversationStage.ADDRESSING_OBJECTIONS]: [
      `I understand your concern. Many people think that at first, but our customers typically save $500 or more per year. How does your current policy compare?`,
      `That's a common concern. What makes our coverage unique is the accident forgiveness feature that prevents your rates from increasing after your first accident. Would that be valuable to you?`
    ],
    [ConversationStage.INTEREST_CONFIRMATION]: [
      `Based on what you've shared, I think our Comprehensive Auto Insurance could be a great fit for you. Would you like to schedule a call with one of our insurance specialists who can provide a personalized quote?`,
      `It sounds like you could benefit from our coverage, especially the roadside assistance feature. Would you be interested in having one of our specialists contact you with a customized quote?`
    ],
    [ConversationStage.CLOSING]: [
      `Thank you for your time today. If your insurance needs change in the future, please don't hesitate to contact ${companyName}.`,
      `Great! I'll have one of our specialists reach out to you soon with more information. What would be the best time for them to call?`
    ]
  };
  
  return {
    companyName,
    industry: 'insurance',
    productInfo,
    scriptTemplates,
    qualificationCriteria
  };
};