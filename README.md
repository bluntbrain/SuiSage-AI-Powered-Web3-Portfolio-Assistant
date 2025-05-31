# SuiSage - AI-Powered Web3 Portfolio Assistant

AI-powered React Native app for Sui blockchain portfolio analysis with glass morphism UI.

## Features

- AI portfolio analysis with OpenAI GPT
- Sui blockchain integration (mainnet/testnet/devnet/localnet)
- Cross-platform (iOS, Android, Web)
- Glass morphism UI with Sui branding
- Real-time portfolio tracking and analytics
- Smart recommendations (gas, staking, diversification)

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
EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here
EXPO_PUBLIC_SUI_NETWORK=testnet
```

### Run
```bash
npm start
# Then press 'i' for iOS, 'a' for Android, or 'w' for web
```

## Usage

1. Select network via dropdown (top-right)
2. Enter Sui wallet address (0x... format)
3. Tap "Analyze" for AI insights
4. View portfolio health and recommendations

## Configuration

### OpenAI API Key
Get from [OpenAI Platform](https://platform.openai.com/api-keys). Optional - app includes fallback analysis.

### Networks
- `testnet` (default) - Test network
- `mainnet` - Production network  
- `devnet` - Development network
- `localnet` - Local network

## Tech Stack

- React Native + Expo
- TypeScript
- Sui TypeScript SDK
- OpenAI GPT API
- Glass morphism UI

## Scripts

- `npm start` - Start development server
- `npm run lint` - Run ESLint
- `npm run ios` - iOS simulator
- `npm run android` - Android emulator

