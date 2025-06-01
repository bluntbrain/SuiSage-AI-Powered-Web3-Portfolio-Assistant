# SuiSage

React Native app that chains AI models together for better Sui blockchain analysis.

## What makes this different

Most AI apps give you one response from one model. This app connects multiple AI models in sequence. The second AI reads the first AI's response and builds on it.

Here's how it works:
- **Chain 1**: OpenAI analyzes first, then Gemini adds to that analysis
- **Chain 2**: Gemini goes first, then OpenAI refines it
- **Compare mode**: See individual responses and chain results side by side

## Why chain AI models

When you chain models together, you get better results:
- The second AI can catch mistakes from the first
- Each AI has different strengths, so you get both
- More thorough analysis than any single AI
- Sometimes the combination finds things neither AI would alone

## Three ways to use it

**Parallel**: Normal AI chat with multiple models responding separately

**Chain**: Sequential processing where each AI builds on the previous response

**Universal**: Compare everything, individual models and chain combinations

## Features

- Voice responses with 30+ voices
- Track which AI approach works best for your questions
- Switch between Sui networks (mainnet, testnet, devnet, localnet)
- Portfolio analysis and security recommendations
- Performance analytics to see what works

## Setup

You need Node.js 16+ and Expo CLI:
```bash
npm install -g @expo/cli
```

Clone and install:
```bash
git clone https://github.com/bluntbrain/SuiSage-AI-Powered-Web3-Portfolio-Assistant.git
cd SuiSage
npm install
```

Add your API keys in `.env`:
```env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
EXPO_PUBLIC_UNREALSPEECH_API_KEY=your_voice_key
EXPO_PUBLIC_SUI_NETWORK=testnet
```

Run it:
```bash
npm start
# Press 'i' for iOS, 'a' for Android, 'w' for web
```

## How to use

1. **Dashboard**: Pick a network, enter your Sui wallet address, tap analyze
2. **Chat**: Ask questions about security or portfolio analysis
3. **Voice mode**: Toggle voice for audio responses (OpenAI only for speed)
4. **Settings**: Change AI providers, pick voices, see analytics

## API keys you need

**OpenAI**: Get from [platform.openai.com](https://platform.openai.com/api-keys) - required for AI chat and voice

**Gemini**: Get from [aistudio.google.com](https://aistudio.google.com/app/apikey) - optional, enables chaining

**UnrealSpeech**: Get from [unrealspeech.com](https://unrealspeech.com) - optional, for voice responses

## Example of chaining in action

You ask: "is my wallet secure?"

**Without chaining**: One AI gives you 3 security tips

**With chaining**: 
1. First AI finds 3 security issues
2. Second AI reads that response and adds 2 more issues the first AI missed
3. You get 5 security issues total plus better recommendations

## What it's built with

- React Native + Expo
- TypeScript
- Sui TypeScript SDK
- OpenAI GPT-4o-mini
- Google Gemini 2.0 Flash
- UnrealSpeech for voices

## Commands

- `npm start` - development server
- `npm run lint` - check code
- `npm run ios` - iOS simulator  
- `npm run android` - Android emulator

