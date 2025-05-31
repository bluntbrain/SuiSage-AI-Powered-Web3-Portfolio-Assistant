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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ThemedText";
import { SuiColors } from "@/constants/Colors";
import { aiService, ChatMessage, AIProvider } from "@/services/aiService";
import {
  trainingDataService,
  ComparisonSession,
} from "@/services/trainingDataService";
import { useWallet } from "@/contexts/WalletContext";
import { voiceService } from "@/services/voiceService";

export default function ChatScreen() {
  const { walletData, aiProviderSettings, voiceSettings, toggleVoiceMode } =
    useWallet();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>(
    []
  );
  const [currentSession, setCurrentSession] =
    useState<ComparisonSession | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<{
    [sessionId: string]: "openai" | "gemini";
  }>({});

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

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // In voice mode, only use OpenAI
    let effectiveProviderSettings = aiProviderSettings;
    if (voiceSettings.enabled) {
      effectiveProviderSettings = {
        openai: true,
        gemini: false,
      };
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
      text: inputText.trim(),
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
        question: inputText.trim(),
        walletData: walletData,
        responses: {},
        selectedBetter: null,
      };
      setCurrentSession(newSession);
    }

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Add loading indicators for enabled AI providers only
    const loadingMessages: ChatMessage[] = enabledProviders.map((provider) => ({
      id: `${provider.id}-loading-${Date.now()}`,
      text: voiceSettings.enabled
        ? "🎤 Generating voice response..."
        : "Thinking...",
      sender: provider.id,
      timestamp: Date.now(),
      isLoading: true,
      sessionId: sessionId, // Associate with session
    }));

    setMessages((prev) => [...prev, ...loadingMessages]);

    try {
      const aiResponses = await aiService.askMultipleAIs(
        inputText.trim(),
        walletData,
        effectiveProviderSettings
      );

      // Add session ID to responses and update session data
      const responsesWithSession = aiResponses.map((response) => ({
        ...response,
        sessionId: sessionId,
      }));

      // Update session with actual responses (only if not in voice mode)
      if (newSession) {
        const updatedSession = { ...newSession };
        responsesWithSession.forEach((response) => {
          if (response.sender === "openai") {
            updatedSession.responses.openai = response.text;
          } else if (response.sender === "gemini") {
            updatedSession.responses.gemini = response.text;
          }
        });
        setCurrentSession(updatedSession);
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

  const handleResponseSelection = async (
    sessionId: string,
    selectedProvider: "openai" | "gemini"
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
          selectedBetter: selectedProvider,
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
                    } AI assistants ready to help`}
              </ThemedText>
            </View>

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
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === "user"
                  ? styles.userMessage
                  : styles.aiMessage,
              ]}
            >
              {message.sender !== "user" && (
                <View style={styles.aiHeader}>
                  <View
                    style={[
                      styles.aiIndicator,
                      { backgroundColor: getSenderColor(message.sender) },
                    ]}
                  />
                  <ThemedText style={styles.aiName}>
                    {getSenderName(message.sender)}
                  </ThemedText>
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
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  message.sender === "user"
                    ? styles.userBubble
                    : styles.aiBubble,
                  message.isLoading && styles.loadingBubble,
                ]}
              >
                <ThemedText
                  style={[
                    styles.messageText,
                    message.sender === "user" ? styles.userText : styles.aiText,
                    message.isLoading && styles.loadingText,
                  ]}
                >
                  {message.text}
                </ThemedText>

                {/* Selection buttons for AI responses (only shown when NOT in voice mode) */}
                {!voiceSettings.enabled &&
                  message.sender !== "user" &&
                  !message.isLoading &&
                  message.sessionId &&
                  // Only show selection buttons when there are multiple AI responses in this session
                  messages.filter(
                    (m) =>
                      m.sessionId === message.sessionId &&
                      m.sender !== "user" &&
                      !m.isLoading
                  ).length > 1 && (
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
                            message.sender as "openai" | "gemini"
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
            </View>
          ))}
        </ScrollView>

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
    paddingHorizontal: 20,
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
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.25)",
    paddingHorizontal: 18,
    paddingVertical: 12,
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
});
