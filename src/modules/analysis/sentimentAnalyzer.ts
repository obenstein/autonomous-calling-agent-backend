import {
  CustomerInput,
  AnalysisResult,
  Sentiment,
  Intent,
  AnalysisResultForAudio,
} from "../../models/types";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

export class SentimentAnalyzer {
  private llmChain: LLMChain;

  constructor(model: string = "llama3.1") {
    const llm = new ChatOllama({
      model,
      baseUrl: "http://172.208.52.162:11434", // 👈 Your Ollama local URL
      temperature: 0,
    });

    const promptTemplate = new PromptTemplate({
      template: `Analyze the following customer response during a cold call.

Customer input: "{input}"

Return a JSON object with the following fields:
1. sentiment: One of: POSITIVE, NEUTRAL, NEGATIVE, INTERESTED, NOT_INTERESTED, NEED_MORE_INFO
2. intent: One of: GREETING, INQUIRY, REJECTION, INTEREST, QUESTION, OBJECTION, UNAVAILABLE, OTHER
3. entities: Any relevant entities mentioned
4. confidenceScore: A number between 0 and 1
5. nextActionCategory: One of: introduce, qualify, address_objection, confirm_interest, schedule_followup, respect_rejection, thank_and_close — used to play a matching audio file and determine the next step

JSON response:`,

      inputVariables: ["input"],
    });

    this.llmChain = new LLMChain({
      llm,
      prompt: promptTemplate,
      outputKey: "analysis",
    });
  }

  async analyze(input: CustomerInput): Promise<AnalysisResultForAudio> {
    const result = await this.llmChain.call({ input: input });
    let raw = result.analysis?.trim() ?? "";
    console.log("🔍 LLM raw output:", raw);

    // Remove ```json fences if they slipped through
    raw = raw
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    // Try to pinpoint the JSON object by locating the first { and last }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      raw = raw.slice(start, end + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("❌ Failed to parse JSON:\n", raw, parseErr);
      // fallback
      return raw;
    }

    console.log("✅ Parsed analysis:", parsed);
    return parsed;

  }
}
