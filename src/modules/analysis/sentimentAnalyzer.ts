import { CustomerInput, AnalysisResult, Sentiment, Intent } from '../../models/types';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";


export class SentimentAnalyzer {
  private llmChain: LLMChain;

  constructor(model: string = 'llama3.1') {
    const llm = new ChatOllama({ 
        model,
        baseUrl: "http://172.208.52.162:11434", // 👈 Your Ollama local URL
      temperature: 0,
    });

    const promptTemplate = new PromptTemplate({
      template: `
      Analyze the following customer response during a cold call. 
      Customer input: "{input}"
      
      Return a JSON object with the following fields:
      1. sentiment: A sentiment classification from these options: POSITIVE, NEUTRAL, NEGATIVE, INTERESTED, NOT_INTERESTED, NEED_MORE_INFO
      2. intent: The customer's intent from these options: GREETING, INQUIRY, REJECTION, INTEREST, QUESTION, OBJECTION, UNAVAILABLE, OTHER
      3. entities: Any relevant entities mentioned (like times, dates, product mentions, competitor names)
      4. confidenceScore: A number between 0 and 1 representing your confidence in this analysis
      
      JSON response:`,
      inputVariables: ["input"],
    });

    this.llmChain = new LLMChain({
      llm,
      prompt: promptTemplate,
      outputKey: "analysis",
    });
  }

  async analyze(input: CustomerInput): Promise<AnalysisResult> {
    try {
      const result = await this.llmChain.call({ input: input.text });
      const raw = result.analysis;
      let parsed: any;
  
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        console.error(
          '⚠️  Failed to parse LLM output as JSON:',
          raw,
          parseErr
        );
        // fallback
        return {
          input,
          sentiment: Sentiment.NEUTRAL,
          intent: Intent.OTHER,
          entities: [],
          confidenceScore: 0.5,
        };
      }
  
      return {
        input,
        sentiment: parsed.sentiment as Sentiment,
        intent: parsed.intent as Intent,
        entities: parsed.entities,
        confidenceScore: parsed.confidenceScore,
      };
    } catch (err) {
      console.error('Error during sentiment analysis:', err);
      return {
        input,
        sentiment: Sentiment.NEUTRAL,
        intent: Intent.OTHER,
        entities: [],
        confidenceScore: 0.5,
      };
    }
  }
  
}