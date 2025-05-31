# SuiSage - AI-Powered Web3 Portfolio Assistant

AI-powered React Native app for Sui blockchain portfolio analysis with glass morphism UI and voice mode.

## Features

- **Dual AI Analysis**: OpenAI GPT-4o-mini + Google Gemini 2.0 Flash responses
- **🎤 Voice Mode**: Natural text-to-speech using UnrealSpeech API with 30+ premium voices
- **AI Comparison Dashboard**: Analytics on model performance and user preferences
- Sui blockchain integration (mainnet/testnet/devnet/localnet)
- Cross-platform (iOS, Android, Web)
- Glass morphism UI with Sui branding
- Real-time portfolio tracking and analytics
- Smart recommendations (gas, staking, diversification)
- Training data collection for AI improvement

## Quick Start

### Prerequisites
- Node.js 16+
- Expo CLI: `npm install -g @expo/cli`

### Setup
```bash
git clone https://github.com/bluntbrain/SuiSage-AI-Powered-Web3-Portfolio-Assistant.git
cd SuiSage
npm install
```

### Environment Variables
Create `.env`:
```env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_UNREALSPEECH_API_KEY=your_unrealspeech_api_key_here
EXPO_PUBLIC_SUI_NETWORK=testnet
```

### Run
```bash
npm start
# Then press 'i' for iOS, 'a' for Android, or 'w' for web
```

## Usage

1. **Dashboard**: Select network via dropdown, enter Sui wallet address (0x... format), tap "Analyze"
2. **Chat**: Ask AI assistants about security, portfolio analysis, or general Web3 questions
3. **🎤 Voice Mode**: Toggle voice button in chat for audio responses (OpenAI-only for speed)
4. **Settings**: Configure AI providers, select voices, view training data analytics

## Configuration

### API Keys

#### OpenAI API Key
Get from [OpenAI Platform](https://platform.openai.com/api-keys). Required for AI chat and voice mode.

#### Google Gemini API Key  
Get from [Google AI Studio](https://aistudio.google.com/app/apikey). Optional - provides dual AI comparison.

#### UnrealSpeech API Key
Get from [UnrealSpeech](https://unrealspeech.com). Optional - enables voice mode with premium natural voices.

### Voice Mode
- **30+ Premium Voices**: American, Chinese, Spanish, French, Hindi, Italian, Portuguese
- **Auto-play**: AI responses automatically convert to speech and play
- **OpenAI Only**: Voice mode uses only OpenAI for faster processing
- **Settings**: Change voice selection in Settings > Voice Mode

### Networks
- `testnet` (default) - Test network
- `mainnet` - Production network  
- `devnet` - Development network
- `localnet` - Local network

## Tech Stack

- React Native + Expo
- TypeScript
- Sui TypeScript SDK
- OpenAI GPT-4o-mini API
- Google Gemini 2.0 Flash API
- UnrealSpeech API (Text-to-Speech)
- expo-av (Audio playback)
- Glass morphism UI

## Scripts

- `npm start` - Start development server
- `npm run lint` - Run ESLint
- `npm run ios` - iOS simulator
- `npm run android` - Android emulator

