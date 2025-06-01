import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Switch,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ThemedText";
import { SuiColors } from "@/constants/Colors";
import {
  aiService,
  ChatMessage,
  AIProvider,
  ChainedResponse,
} from "@/services/aiService";
import {
  trainingDataService,
  ComparisonSession,
  ChatMode,
  ChainConfig,
  CHAIN_CONFIGS,
  ModelResponse,
  getAvailableSelectionOptions,
} from "@/services/trainingDataService";
import { useWallet } from "@/contexts/WalletContext";
import { voiceService } from "@/services/voiceService";

export default function ChatScreen() {
  const {
    walletData,
    aiProviderSettings,
    voiceSettings,
    toggleVoiceMode,
    chatSettings,
    setChatMode,
    setSelectedChainConfig,
    toggleChainMode,
    setShowChainComparison,
  } = useWallet();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showChainSettings, setShowChainSettings] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>(
    []
  );
  const [currentSession, setCurrentSession] =
    useState<ComparisonSession | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<{
    [sessionId: string]: string; // Can be modelId or chainId
  }>({});
  const [expandedResponses, setExpandedResponses] = useState<{
    [responseId: string]: boolean;
  }>({});
  const [expandedSessions, setExpandedSessions] = useState<{
    [sessionId: string]: boolean;
  }>({});

  // Suggested prompts for when chat is empty
  const suggestedPrompts = [
    "Analyze my wallet security",
    "What are common DeFi risks?",
    "How to secure my Sui wallet?",
    "Check my transaction history",
    "Explain staking risks",
    "What is a smart contract audit?",
  ];

  const handlePromptSelect = (prompt: string) => {
    setInputText(prompt);
    // Auto-send the prompt
    setTimeout(() => {
      handleSendMessageWithText(prompt);
    }, 100);
  };

  const toggleResponseExpansion = (responseId: string) => {
    setExpandedResponses((prev) => ({
      ...prev,
      [responseId]: !prev[responseId],
    }));
  };

  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const getPreviewText = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const isResponseExpanded = (responseId: string): boolean => {
    return expandedResponses[responseId] || false;
  };

  const isSessionExpanded = (sessionId: string): boolean => {
    return expandedSessions[sessionId] || false;
  };

  const handleSendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Rest of the send message logic...
    const messageText = text.trim();

    // In voice mode, only use OpenAI
    let effectiveProviderSettings = aiProviderSettings;
    if (voiceSettings.enabled) {
      effectiveProviderSettings = {
        openai: true,
        gemini: false,
      };
    }

    // Determine effective chat mode - support universal mode
    let effectiveChatMode: ChatMode = "parallel";
    if (chatSettings.chainEnabled && chatSettings.showChainComparison) {
      effectiveChatMode = "universal";
    } else if (chatSettings.chainEnabled) {
      effectiveChatMode = "chain";
    }

    // Check if any providers are enabled
    const enabledProviders = availableProviders.filter(
      (provider) => provider.enabled && effectiveProviderSettings[provider.id]
    );

    if (enabledProviders.length === 0) {
      const errorMessage: ChatMessage = {
        id: `no-providers-${Date.now()}`,
        text: voiceSettings.enabled
          ? "Voice mode requires OpenAI to be available. Please check your API configuration."
          : "No AI assistants are currently enabled. Please enable at least one AI provider in Settings.",
        sender: "openai",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: Date.now(),
    };

    // Create comparison session for training data (only if not in voice mode)
    const sessionId = `session-${Date.now()}`;
    let newSession: ComparisonSession | null = null;

    if (!voiceSettings.enabled) {
      newSession = {
        id: sessionId,
        timestamp: Date.now(),
        question: messageText,
        walletData: walletData,
        chatMode: effectiveChatMode,
        chainConfig: chatSettings.selectedChainConfig || undefined,
        responses: {},
        chainData: undefined,
        selectedOption: null,
      };
      setCurrentSession(newSession);
    }

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Add loading indicators based on effective chat mode
    let loadingMessages: ChatMessage[];

    if (effectiveChatMode === "universal") {
      // Show loading indicators for both individual models and chains
      const modelLoadingMessages = enabledProviders.map((provider) => ({
        id: `${provider.id}-loading-${Date.now()}`,
        text: "Thinking...",
        sender: provider.id,
        timestamp: Date.now(),
        isLoading: true,
        sessionId: sessionId,
      }));

      const chainLoadingMessages = CHAIN_CONFIGS.map((config, index) => ({
        id: `chain-loading-${index}-${Date.now()}`,
        text: `🔗 ${config.name}...`,
        sender: `chain_${index}` as any,
        timestamp: Date.now(),
        isLoading: true,
        sessionId: sessionId,
      }));

      loadingMessages = [...modelLoadingMessages, ...chainLoadingMessages];
    } else if (effectiveChatMode === "chain") {
      // Show loading indicators for each chain configuration
      loadingMessages = CHAIN_CONFIGS.map((config, index) => ({
        id: `chain-loading-${index}-${Date.now()}`,
        text: voiceSettings.enabled
          ? "🎤 Generating chain response..."
          : `🔗 ${config.name}...`,
        sender: `chain_${index}` as any,
        timestamp: Date.now(),
        isLoading: true,
        sessionId: sessionId,
      }));
    } else {
      // Show loading indicators for parallel mode
      loadingMessages = enabledProviders.map((provider) => ({
        id: `${provider.id}-loading-${Date.now()}`,
        text: voiceSettings.enabled
          ? "🎤 Generating voice response..."
          : "Thinking...",
        sender: provider.id,
        timestamp: Date.now(),
        isLoading: true,
        sessionId: sessionId,
      }));
    }

    setMessages((prev) => [...prev, ...loadingMessages]);

    try {
      // Use new unified AI processing method
      const result = await aiService.processAIRequest(
        messageText,
        walletData,
        effectiveChatMode,
        chatSettings.selectedChainConfig || undefined,
        effectiveProviderSettings
      );

      let responsesWithSession: ChatMessage[] = [];
      let updatedSession = newSession;

      if (effectiveChatMode === "parallel") {
        // Handle parallel responses (existing logic)
        const aiResponses = result as ChatMessage[];
        responsesWithSession = aiResponses.map((response) => ({
          ...response,
          sessionId: sessionId,
        }));

        // Update session with actual responses (only if not in voice mode)
        if (updatedSession) {
          responsesWithSession.forEach((response) => {
            const modelResponse: ModelResponse = {
              modelId: response.sender,
              content: response.text,
              timestamp: response.timestamp,
            };
            updatedSession!.responses[response.sender] = modelResponse;
          });
          setCurrentSession(updatedSession);
        }
      } else if (effectiveChatMode === "chain") {
        // Handle multiple chained responses for comparison
        const chainedResults = result as ChainedResponse[];
        responsesWithSession = chainedResults.map((chainResult, index) => ({
          ...chainResult.finalResponse,
          sessionId: sessionId,
          sender: `chain_${index}` as any,
        }));

        // Update session with chain data
        if (updatedSession) {
          updatedSession.chainResponses = {};
          chainedResults.forEach((chainResult, index) => {
            const chainId = `chain_${index}`;
            updatedSession!.chainResponses![chainId] = {
              chainConfig: CHAIN_CONFIGS[index],
              responses: chainResult.responses,
              chainData: chainResult.chainData,
            };
          });
          setCurrentSession(updatedSession);
        }
      } else if (effectiveChatMode === "universal") {
        // Handle universal mode with both parallel and chain responses
        const universalResult = result as {
          parallelResponses: ChatMessage[];
          chainResponses: ChainedResponse[];
        };

        const parallelResponses = universalResult.parallelResponses.map(
          (response) => ({
            ...response,
            sessionId: sessionId,
          })
        );

        const chainResponses = universalResult.chainResponses.map(
          (chainResult, index) => ({
            ...chainResult.finalResponse,
            sessionId: sessionId,
            sender: `chain_${index}` as any,
          })
        );

        responsesWithSession = [...parallelResponses, ...chainResponses];

        // Update session with both parallel and chain data
        if (updatedSession) {
          // Add parallel responses
          parallelResponses.forEach((response) => {
            const modelResponse: ModelResponse = {
              modelId: response.sender,
              content: response.text,
              timestamp: response.timestamp,
            };
            updatedSession!.responses[response.sender] = modelResponse;
          });

          // Add chain responses
          updatedSession.chainResponses = {};
          universalResult.chainResponses.forEach((chainResult, index) => {
            const chainId = `chain_${index}`;
            updatedSession!.chainResponses![chainId] = {
              chainConfig: CHAIN_CONFIGS[index],
              responses: chainResult.responses,
              chainData: chainResult.chainData,
            };
          });

          setCurrentSession(updatedSession);
        }
      }

      // Remove loading messages and add real responses
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        return [...withoutLoading, ...responsesWithSession];
      });

      // Auto-play voice response if voice mode is enabled
      if (voiceSettings.enabled && responsesWithSession.length > 0) {
        // Play the first (and only) OpenAI response
        const openaiResponse = responsesWithSession.find(
          (r) => r.sender === "openai"
        );
        if (openaiResponse) {
          await playResponseAudio(openaiResponse.text);
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        sender: "openai",
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        return [...withoutLoading, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    await handleSendMessageWithText(inputText.trim());
  };

  const handleVoiceToggle = () => {
    if (!voiceService.isApiConfigured()) {
      Alert.alert(
        "Voice Mode Unavailable",
        "UnrealSpeech API key is not configured. Please add EXPO_PUBLIC_UNREALSPEECH_API_KEY to your environment variables.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    toggleVoiceMode();
  };

  const playResponseAudio = async (text: string) => {
    if (!voiceSettings.enabled || !voiceService.isApiConfigured()) {
      return;
    }

    try {
      setIsProcessingAudio(true);
      await voiceService.convertAndPlay(text, voiceSettings.selectedVoice);
    } catch (error) {
      console.error("[Chat] Voice playback failed:", error);
      // Don't show error to user - voice is optional feature
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleResponseSelection = async (
    sessionId: string,
    selectedProvider: string
  ) => {
    try {
      // Update local state
      setSelectedResponses((prev) => ({
        ...prev,
        [sessionId]: selectedProvider,
      }));

      // Find the session and save training data
      if (currentSession && currentSession.id === sessionId) {
        const updatedSession = {
          ...currentSession,
          selectedOption: selectedProvider,
        };
        await trainingDataService.saveComparisonData(updatedSession);
        console.log(
          `[Chat] Saved training data: ${selectedProvider} selected for session ${sessionId}`
        );
      }
    } catch (error) {
      console.error("[Chat] Failed to save training data:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSenderName = (sender: ChatMessage["sender"]) => {
    // Handle chain responses
    if (typeof sender === "string" && sender.startsWith("chain_")) {
      const chainIndex = parseInt(sender.replace("chain_", ""));
      const chainConfig = CHAIN_CONFIGS[chainIndex];
      return chainConfig ? chainConfig.name : `Chain ${chainIndex + 1}`;
    }

    switch (sender) {
      case "openai":
        return "OpenAI GPT";
      case "gemini":
        return "Google Gemini";
      case "user":
        return "You";
      default:
        return sender;
    }
  };

  const getSenderColor = (sender: ChatMessage["sender"]) => {
    // Handle chain responses
    if (typeof sender === "string" && sender.startsWith("chain_")) {
      const chainIndex = parseInt(sender.replace("chain_", ""));
      // Alternate colors for different chains
      return chainIndex === 0 ? "#8B5CF6" : "#F59E0B";
    }

    switch (sender) {
      case "openai":
        return "#10B981";
      case "gemini":
        return "#3B82F6";
      case "user":
        return SuiColors.sea;
      default:
        return SuiColors.aqua;
    }
  };

  const getAILogo = (sender: ChatMessage["sender"]) => {
    switch (sender) {
      case "openai":
        return require("@/assets/images/chatgpt.png");
      case "gemini":
        return require("@/assets/images/gemini.png");
      default:
        return null;
    }
  };

  const renderAIIndicator = (sender: ChatMessage["sender"]) => {
    const logo = getAILogo(sender);

    if (logo) {
      return <Image source={logo} style={styles.aiLogo} resizeMode="contain" />;
    }

    // Fallback to colored dot for chain responses or unknown senders
    return (
      <View
        style={[
          styles.aiIndicator,
          { backgroundColor: getSenderColor(sender) },
        ]}
      />
    );
  };

  useEffect(() => {
    setAvailableProviders(aiService.getAvailableProviders());

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      text: walletData
        ? `Hi! I'm your security-focused Web3 assistant. I can help you understand your Sui wallet, analyze transactions, and provide security recommendations. What would you like to know?`
        : `Hi! I'm your Web3 security assistant. Connect a wallet on the Dashboard to get personalized insights, or ask me general questions about Sui blockchain security.`,
      sender: "openai",
      timestamp: Date.now(),
    };

    setMessages([welcomeMessage]);
  }, [walletData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[SuiColors.ocean, SuiColors.deepOcean]}
        style={styles.backgroundGradient}
      />

      <View style={[styles.glowEffect, styles.glowTop]} />
      <View style={[styles.glowEffect, styles.glowBottom]} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 140 : 90}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.headerTitle}>
                {voiceSettings.enabled ? "🎤 Voice Chat" : "AI Chat"}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {voiceSettings.enabled
                  ? `Voice mode - ${voiceSettings.selectedVoice}`
                  : `${
                      availableProviders.filter(
                        (p) => p.enabled && aiProviderSettings[p.id]
                      ).length
                    } AI assistants ready to help${
                      chatSettings.chainEnabled &&
                      chatSettings.showChainComparison
                        ? " • Universal Comparison Mode"
                        : chatSettings.chainEnabled
                        ? " • Chain Mode"
                        : ""
                    }`}
              </ThemedText>
            </View>

            <View style={styles.voiceToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.voiceToggle,
                  voiceSettings.enabled && styles.voiceToggleActive,
                  !voiceService.isApiConfigured() && styles.voiceToggleDisabled,
                ]}
                onPress={handleVoiceToggle}
              >
                <IconSymbol
                  name={voiceSettings.enabled ? "mic.fill" : "mic"}
                  size={20}
                  color={
                    voiceSettings.enabled ? "white" : "rgba(192, 230, 255, 0.7)"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chainToggle,
                  chatSettings.chainEnabled && styles.chainToggleActive,
                ]}
                onPress={() => setShowChainSettings(!showChainSettings)}
              >
                <IconSymbol
                  name="link"
                  size={18}
                  color={
                    chatSettings.chainEnabled
                      ? "white"
                      : "rgba(192, 230, 255, 0.7)"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Chain Settings Dropdown */}
        {showChainSettings && (
          <View style={styles.chainSettingsContainer}>
            <View style={styles.chainSettingsHeader}>
              <ThemedText style={styles.chainSettingsTitle}>
                Comparison Settings
              </ThemedText>
              <TouchableOpacity onPress={() => setShowChainSettings(false)}>
                <IconSymbol
                  name="xmark"
                  size={16}
                  color="rgba(192, 230, 255, 0.6)"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.chainSetting}>
              <ThemedText style={styles.chainSettingLabel}>
                Enable Chain Mode
              </ThemedText>
              <Switch
                value={chatSettings.chainEnabled}
                onValueChange={toggleChainMode}
                trackColor={{
                  false: "rgba(77, 162, 255, 0.2)",
                  true: SuiColors.sea,
                }}
                thumbColor={chatSettings.chainEnabled ? "white" : "#f4f3f4"}
              />
            </View>

            <View style={styles.chainSetting}>
              <ThemedText style={styles.chainSettingLabel}>
                Universal Comparison
              </ThemedText>
              <Switch
                value={chatSettings.showChainComparison}
                onValueChange={setShowChainComparison}
                trackColor={{
                  false: "rgba(77, 162, 255, 0.2)",
                  true: SuiColors.sea,
                }}
                thumbColor={
                  chatSettings.showChainComparison ? "white" : "#f4f3f4"
                }
              />
            </View>

            <ThemedText style={styles.chainSettingDescription}>
              Universal mode compares all options: individual models (OpenAI,
              Gemini) AND chain combinations (OpenAI→Gemini, Gemini→OpenAI) in
              one response.
            </ThemedText>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => {
            // Group consecutive AI messages from the same session
            const isAIMessage = message.sender !== "user";
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const nextMessage =
              index < messages.length - 1 ? messages[index + 1] : null;

            const isFirstInGroup =
              !previousMessage ||
              previousMessage.sender === "user" ||
              previousMessage.sessionId !== message.sessionId;
            const isLastInGroup =
              !nextMessage ||
              nextMessage.sender === "user" ||
              nextMessage.sessionId !== message.sessionId;

            // Count AI responses in this session
            const sessionResponses = messages.filter(
              (m) =>
                m.sessionId === message.sessionId &&
                m.sender !== "user" &&
                !m.isLoading
            );
            const hasMultipleResponses = sessionResponses.length > 1;

            return (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.sender === "user"
                    ? styles.userMessage
                    : styles.aiMessage,
                  isAIMessage && !isFirstInGroup && styles.groupedMessage,
                ]}
              >
                {/* Session Header - shown only for the first AI response in a group */}
                {isAIMessage && isFirstInGroup && hasMultipleResponses && (
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionHeaderContent}>
                      <View style={styles.sessionHeaderLeft}>
                        <IconSymbol
                          name="brain.head.profile"
                          size={16}
                          color={SuiColors.aqua}
                        />
                        <ThemedText style={styles.sessionHeaderText}>
                          AI Comparison ({sessionResponses.length} responses)
                        </ThemedText>
                        {chatSettings.chainEnabled &&
                          chatSettings.showChainComparison && (
                            <View style={styles.sessionModeIndicator}>
                              <ThemedText style={styles.sessionModeText}>
                                🌐 Universal
                              </ThemedText>
                            </View>
                          )}

                        <TouchableOpacity
                          style={styles.sessionToggleButton}
                          onPress={() =>
                            toggleSessionExpansion(message.sessionId!)
                          }
                        >
                          <IconSymbol
                            name={
                              isSessionExpanded(message.sessionId!)
                                ? "chevron.up.circle"
                                : "chevron.down.circle"
                            }
                            size={20}
                            color={SuiColors.aqua}
                          />
                          <ThemedText style={styles.sessionToggleText}>
                            {isSessionExpanded(message.sessionId!)
                              ? "Collapse All"
                              : "Expand All"}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {message.sender !== "user" && (
                  <View
                    style={[
                      styles.aiHeader,
                      isAIMessage && !isFirstInGroup && styles.compactHeader,
                    ]}
                  >
                    {renderAIIndicator(message.sender)}
                    <ThemedText style={styles.aiName}>
                      {getSenderName(message.sender)}
                    </ThemedText>

                    {/* Chain flow indicator */}
                    {typeof message.sender === "string" &&
                      message.sender.startsWith("chain_") && (
                        <View style={styles.chainFlowContainer}>
                          <View style={styles.chainFlowIndicator}>
                            {(() => {
                              const chainIndex = parseInt(
                                message.sender.replace("chain_", "")
                              );
                              const chainConfig = CHAIN_CONFIGS[chainIndex];
                              if (!chainConfig) return null;

                              return chainConfig.models.map(
                                (modelId, stepIndex) => (
                                  <View
                                    key={stepIndex}
                                    style={styles.chainStep}
                                  >
                                    {stepIndex > 0 && (
                                      <IconSymbol
                                        name="arrow.right"
                                        size={10}
                                        color="rgba(192, 230, 255, 0.6)"
                                        style={styles.chainArrow}
                                      />
                                    )}
                                    {getAILogo(modelId as any) ? (
                                      <Image
                                        source={getAILogo(modelId as any)!}
                                        style={styles.chainStepLogo}
                                        resizeMode="contain"
                                      />
                                    ) : (
                                      <View
                                        style={[
                                          styles.chainStepBadge,
                                          {
                                            backgroundColor:
                                              modelId === "openai"
                                                ? "#10B981"
                                                : "#3B82F6",
                                          },
                                        ]}
                                      >
                                        <ThemedText
                                          style={styles.chainStepText}
                                        >
                                          {modelId === "openai" ? "GPT" : "GEM"}
                                        </ThemedText>
                                      </View>
                                    )}
                                  </View>
                                )
                              );
                            })()}
                          </View>
                        </View>
                      )}

                    {voiceSettings.enabled &&
                      message.sender === "openai" &&
                      !message.isLoading && (
                        <View style={styles.voiceIndicator}>
                          <IconSymbol
                            name={
                              isProcessingAudio
                                ? "speaker.wave.3.fill"
                                : "speaker.2.fill"
                            }
                            size={12}
                            color="rgba(192, 230, 255, 0.6)"
                          />
                        </View>
                      )}

                    {/* Expand/Collapse button for AI responses */}
                    {!message.isLoading &&
                      message.text.length > 100 &&
                      message.sessionId &&
                      !isSessionExpanded(message.sessionId) && (
                        <TouchableOpacity
                          style={styles.expandButton}
                          onPress={() => toggleResponseExpansion(message.id)}
                        >
                          <IconSymbol
                            name={
                              isResponseExpanded(message.id)
                                ? "chevron.up"
                                : "chevron.down"
                            }
                            size={14}
                            color="rgba(192, 230, 255, 0.6)"
                          />
                        </TouchableOpacity>
                      )}
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    message.sender === "user"
                      ? styles.userBubble
                      : styles.aiBubble,
                    message.isLoading && styles.loadingBubble,
                    isAIMessage && !isFirstInGroup && styles.groupedBubble,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.messageText,
                      message.sender === "user"
                        ? styles.userText
                        : styles.aiText,
                      message.isLoading && styles.loadingText,
                    ]}
                  >
                    {(() => {
                      if (message.sender === "user" || message.isLoading) {
                        return message.text;
                      }

                      // For AI responses, check both individual and session expansion
                      const shouldExpand =
                        isResponseExpanded(message.id) ||
                        (message.sessionId &&
                          isSessionExpanded(message.sessionId));

                      return shouldExpand
                        ? message.text
                        : getPreviewText(message.text, 100);
                    })()}
                  </ThemedText>

                  {/* Selection buttons for AI responses (only shown when NOT in voice mode) */}
                  {!voiceSettings.enabled &&
                    message.sender !== "user" &&
                    !message.isLoading &&
                    message.sessionId &&
                    hasMultipleResponses && (
                      <View style={styles.selectionContainer}>
                        <TouchableOpacity
                          style={[
                            styles.selectionButton,
                            selectedResponses[message.sessionId] ===
                              message.sender && styles.selectedButton,
                          ]}
                          onPress={() =>
                            handleResponseSelection(
                              message.sessionId!,
                              message.sender as string
                            )
                          }
                        >
                          <IconSymbol
                            name="hand.thumbsup.fill"
                            size={14}
                            color={
                              selectedResponses[message.sessionId] ===
                              message.sender
                                ? "white"
                                : "rgba(192, 230, 255, 0.6)"
                            }
                          />
                          <ThemedText
                            style={[
                              styles.selectionText,
                              selectedResponses[message.sessionId] ===
                                message.sender && styles.selectedText,
                            ]}
                          >
                            Better
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>

                {/* Show comparison instructions only once per session group */}
                {!voiceSettings.enabled &&
                  isAIMessage &&
                  isLastInGroup &&
                  hasMultipleResponses && (
                    <View style={styles.comparisonHint}>
                      {selectedResponses[message.sessionId!] ? (
                        <ThemedText style={styles.comparisonHintText}>
                          ✅ Selected:{" "}
                          {getSenderName(
                            selectedResponses[message.sessionId!] as any
                          )}
                        </ThemedText>
                      ) : (
                        <ThemedText style={styles.comparisonHintText}>
                          👆 Compare all responses above and select the best one
                        </ThemedText>
                      )}
                    </View>
                  )}
              </View>
            );
          })}
        </ScrollView>

        {/* Suggested Prompts - Only show when chat is empty (only welcome message) */}
        {messages.length <= 1 && (
          <View style={styles.suggestedPromptsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedPromptsScrollContent}
              style={styles.suggestedPromptsScroll}
            >
              {suggestedPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestedPromptButton}
                  onPress={() => handlePromptSelect(prompt)}
                  disabled={isLoading}
                >
                  <ThemedText style={styles.suggestedPromptText}>
                    {prompt}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom + 16, 100) },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={
                voiceSettings.enabled
                  ? "Type your message (voice response will play)..."
                  : "Ask about Sui & DeFi security..."
              }
              placeholderTextColor="rgba(192, 230, 255, 0.5)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.disabledButton,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <IconSymbol name="paperplane.fill" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SuiColors.deepOcean,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowEffect: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: SuiColors.sea,
    opacity: 0.05,
  },
  glowTop: {
    top: -100,
    right: -100,
  },
  glowBottom: {
    bottom: -100,
    left: -100,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 162, 255, 0.1)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: SuiColors.aqua,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
  },
  voiceToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  voiceToggleActive: {
    backgroundColor: SuiColors.sea,
    borderColor: SuiColors.sea,
  },
  voiceToggleDisabled: {
    opacity: 0.5,
  },
  chainToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  chainToggleActive: {
    backgroundColor: SuiColors.sea,
    borderColor: SuiColors.sea,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  aiMessage: {
    alignItems: "flex-start",
  },
  groupedMessage: {
    marginTop: 8,
    marginBottom: 8,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  aiIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  aiName: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(192, 230, 255, 0.8)",
  },
  voiceIndicator: {
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: SuiColors.sea,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderBottomLeftRadius: 4,
  },
  groupedBubble: {
    paddingVertical: 8,
    marginTop: 4,
  },
  loadingBubble: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "white",
  },
  aiText: {
    color: SuiColors.aqua,
  },
  loadingText: {
    fontStyle: "italic",
    opacity: 0.8,
  },
  inputContainer: {
    paddingHorizontal: 8,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 162, 255, 0.15)",
    backgroundColor: "rgba(1, 24, 41, 0.95)",
    backdropFilter: "blur(20px)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(77, 162, 255, 0.08)",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    color: SuiColors.aqua,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    minHeight: 24,
    marginRight: 16,
    fontWeight: "400",
  },
  sendButton: {
    borderRadius: 8,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  selectionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
  },
  selectedButton: {
    backgroundColor: SuiColors.sea,
    borderColor: SuiColors.sea,
  },
  selectionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(192, 230, 255, 0.8)",
    marginLeft: 4,
  },
  selectedText: {
    color: "white",
  },
  suggestedPromptsContainer: {
    padding: 8,
  },
  suggestedPromptsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 2,
    paddingHorizontal: 16,
  },
  suggestedPromptsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  suggestedPromptsScroll: {
    flexDirection: "row",
  },
  suggestedPromptButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(77, 162, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.25)",
    borderRadius: 20,
    marginRight: 8,
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
  },
  suggestedPromptText: {
    fontSize: 14,
    fontWeight: "500",
    color: SuiColors.aqua,
    textAlign: "center",
  },
  chainSettingsContainer: {
    padding: 16,
    backgroundColor: "rgba(1, 24, 41, 0.8)",
  },
  chainSettingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chainSettingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  chainSetting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chainSettingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  chainSettingDescription: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.8)",
  },
  chainFlowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  chainFlowIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  chainStep: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  chainStepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  chainStepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  chainArrow: {
    marginRight: 4,
  },
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  comparisonHint: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(1, 24, 41, 0.8)",
    borderRadius: 8,
  },
  comparisonHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(192, 230, 255, 0.8)",
  },
  sessionHeader: {
    padding: 8,
    backgroundColor: "rgba(1, 24, 41, 0.8)",
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginLeft: 8,
    flex: 1,
  },
  sessionModeIndicator: {
    padding: 4,
    backgroundColor: SuiColors.sea,
    borderRadius: 4,
    marginLeft: 8,
  },
  sessionModeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  compactHeader: {
    marginTop: 8,
  },
  sessionToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    marginLeft: 8,
  },
  sessionToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginLeft: 4,
  },
  aiLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  chainStepLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
});
