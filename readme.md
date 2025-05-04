# AI-Powered Telephony Agent System

## Overview

This project is an **AI-powered telephony agent system** designed to automate customer interactions during phone calls. It integrates with **Twilio** for telephony services and uses **AI-driven natural language processing (NLP)** to analyze customer responses, generate conversational responses, and manage call flows dynamically. The system is built to assist businesses in automating cold calls, lead qualification, and customer engagement.

## Features

- **AI-Driven Conversations**: Uses AI models to analyze customer input and generate context-aware responses.
- **Dynamic Call Flow Management**: Manages conversation stages such as introduction, qualification, objection handling, and closing.
- **Audio Playback**: Plays pre-recorded audio clips for specific conversation actions.
- **Speech Recognition**: Processes customer speech in real-time using Twilio's speech-to-text capabilities.
- **Lead Management**: Tracks and updates lead information, including conversation history, sentiment analysis, and qualification status.
- **Industry-Specific Configurations**: Supports customizable configurations for different industries (e.g., insurance, SaaS).
- **Webhooks Integration**: Handles real-time events such as call status updates and speech recognition results.

## Technologies Used

- **Backend Framework**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **AI/NLP**: [LangChain](https://www.langchain.com/) and [Ollama](https://ollama.ai/) for sentiment analysis and response generation
- **Telephony**: [Twilio](https://www.twilio.com/) for call handling, speech recognition, and audio playback
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for lead and analytics storage
- **Environment Management**: [dotenv](https://github.com/motdotla/dotenv) for environment variables
- **TypeScript**: Ensures type safety and maintainability
- **Event-Driven Architecture**: Uses Node.js `EventEmitter` for managing call events

## Key Modules

1. **Conversation Manager**:
   - Manages the state of the conversation.
   - Determines the next action based on customer input and conversation history.
   - Plays audio clips or generates text-to-speech responses.

2. **Telephony Service**:
   - Handles call initiation, updates, and termination.
   - Integrates with Twilio for telephony operations.

3. **Sentiment Analyzer**:
   - Analyzes customer input to determine sentiment, intent, and next action category.

4. **Response Generator**:
   - Generates AI-driven responses using LangChain and Ollama.

5. **Lead Repository**:
   - Stores and retrieves lead information from MongoDB.
   - Tracks conversation history, lead status, and follow-up actions.

## How It Works

1. **Call Initiation**:
   - A call is initiated via the `/api/calls` endpoint.
   - The system uses Twilio to dial the customer and starts a conversation.

2. **Real-Time Speech Processing**:
   - Customer speech is captured and sent to the `/api/calls/:callId/customerSpeech` endpoint.
   - The speech is analyzed for sentiment, intent, and entities.

3. **Dynamic Response Generation**:
   - Based on the analysis, the system determines the next action and either plays a pre-recorded audio clip or generates a text-to-speech response.

4. **Lead Management**:
   - The system updates the lead's status and stores conversation history in MongoDB.

5. **Call Completion**:
   - Once the conversation ends, the system cleans up resources and stores analytics data.

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ai-telephony-agent.git
   cd ai-telephony-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory with the following variables:
     ```
     TWILIO_ACCOUNT_SID=your-twilio-account-sid
     TWILIO_AUTH_TOKEN=your-twilio-auth-token
     TWILIO_PHONE_NUMBER=your-twilio-phone-number
     TWILIO_TWIML_APP_SID=your-twilio-twiml-app-sid
     WEBHOOK_BASE_URL=your-webhook-base-url
     COMPANY_NAME=your-company-name
     INDUSTRY=insurance
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the API at `http://localhost:3000`.

## API Endpoints

- **POST /api/calls**: Initiates a new call.
- **POST /api/calls/:callId/customerSpeech**: Processes customer speech input.
- **POST /twiml/status-callback**: Handles Twilio call status updates.
- **POST /webhooks/speech**: Handles speech recognition results from Twilio.

## Future Enhancements

- Add support for more industries and configurations.
- Implement a user-friendly dashboard for managing leads and analytics.
- Enhance AI capabilities with more advanced models.
- Add multi-language support for global use cases.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any inquiries or collaboration opportunities, feel free to reach out:

- **Email**: your-email@example.com
- **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/your-profile)
- **GitHub**: [Your GitHub Profile](https://github.com/your-username)