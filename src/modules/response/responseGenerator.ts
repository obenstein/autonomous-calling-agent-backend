import { ConversationState, ConversationStage, AgentConfig } from '../../models/types';
import { LLMChain } from 'langchain/chains';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { PromptTemplate } from "@langchain/core/prompts";

export class ResponseGenerator {
  private llmChain: LLMChain;
  private config: AgentConfig;
  private defaultResponses: Record<string, string[]>;

  constructor(config: AgentConfig, model: string = 'llama3.1') {
    this.config = config;
    
    // Initialize default responses for fallback
    this.defaultResponses = {
      'introduce': [
        `Hello, my name is Alex from ${config.companyName}. I'm calling to discuss our ${config.productInfo.name} that helps people like you with ${config.productInfo.benefits[0]}. Do you have a moment to chat?`,
        `Hi there, this is Alex with ${config.companyName}. We've been helping people in your area with ${config.productInfo.benefits[0]}. Would you be interested in hearing how we might be able to help you?`
      ],
      'qualify': [
        `Great! Just to make sure our ${config.productInfo.name} is a good fit for you, may I ask if you currently have any coverage for ${config.industry === 'insurance' ? 'this type of insurance' : 'this need'}?`,
        `Excellent! To better understand your needs, could you tell me a bit about your current situation regarding ${config.industry === 'insurance' ? 'insurance coverage' : 'this area'}?`
      ],
      'address_objection': [
        `I understand your concern. Many people think that at first, but what they discover is that ${config.productInfo.benefits[0]}. Would that be valuable to you?`,
        `That's a common concern. What our customers typically find is that ${config.productInfo.benefits[1]}. How would that impact your situation?`
      ],
      'confirm_interest': [
        `Based on what you've shared, our ${config.productInfo.name} could be a great fit for you. It specifically helps with ${config.productInfo.keyFeatures[0]}. Would you like to schedule a follow-up with one of our specialists?`,
        `It sounds like you could benefit from our ${config.productInfo.name}, especially the ${config.productInfo.keyFeatures[1]} feature. Would you be interested in learning more from one of our specialists?`
      ],
      'respect_rejection': [
        `I understand. Thank you for your time today. If your situation changes, please don't hesitate to reach out to ${config.companyName}.`,
        `No problem at all. I appreciate you taking my call. Have a great day!`
      ],
      'schedule_followup': [
        `Great! I'll have one of our specialists contact you with more information. Would you prefer a call or an email?`,
        `Excellent! What would be the best time for one of our specialists to reach out to you with more detailed information?`
      ],
      'thank_and_close': [
        `Thank you for your time today. If you have any questions in the future about ${config.productInfo.name}, please don't hesitate to contact us.`,
        `I appreciate you taking the time to speak with me today. Have a wonderful day!`
      ]
    };

    const llm = new ChatOllama({ 
        baseUrl: "http://172.208.52.162:11434", // 👈 Your Ollama local URL
        model: model, // 👈 Match this with `ollama list` output
        temperature: 0.7, // Slightly higher temperature for more varied responses
    });

    const promptTemplate = new PromptTemplate({
      template: `
      You are an AI assistant for ${this.config.companyName}, specializing in ${this.config.industry}.
      
      Current conversation state:
      - Stage: {stage}
      - Next action: {nextAction}
      - Customer name: {customerName}
      
      Conversation history:
      {conversationHistory}
      
      Based on this information, generate a natural, conversational response for a phone call that:
      1. Follows the appropriate next action: {nextAction}
      2. Addresses any customer concerns or questions
      3. Moves the conversation forward appropriately
      4. Sounds natural and not scripted
      5. Is brief and to the point (1-3 sentences)
      
      Key product information to reference if relevant:
      - Product name: ${this.config.productInfo.name}
      - Key features: ${this.config.productInfo.keyFeatures.join(', ')}
      - Benefits: ${this.config.productInfo.benefits.join(', ')}
      
      Response:`,
      inputVariables: ["stage", "nextAction", "customerName", "conversationHistory"],
    });

    this.llmChain = new LLMChain({
      llm,
      prompt: promptTemplate,
      outputKey: "response",
    });
  }

  async generateResponse(state: ConversationState): Promise<string> {
    try {
      // Format conversation history
      const conversationHistory = state.history.map(h => 
        `Customer: ${h.input.text}\nAgent: ${h.agentResponse}`
      ).join('\n\n');
      
      // Generate response using LLM
      const result = await this.llmChain.call({
        stage: state.currentStage,
        nextAction: state.nextAction,
        customerName: state.customer.name || "there",
        conversationHistory
      });
      
      return result.response;
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback to default responses
      const fallbackResponses = this.defaultResponses[state.nextAction];
      if (fallbackResponses && fallbackResponses.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
        return fallbackResponses[randomIndex];
      }
      
      return `I apologize, but I'm having trouble with my system. Would it be alright if I have someone call you back?`;
    }
  }
}
