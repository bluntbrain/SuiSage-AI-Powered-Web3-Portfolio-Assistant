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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { SuiColors } from "@/constants/Colors";
import { aiService, ChatMessage, AIProvider } from "@/services/aiService";
import { useWallet } from "@/contexts/WalletContext";

export default function ChatScreen() {
  const { walletData, aiProviderSettings } = useWallet();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>(
    []
  );

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

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Check if any providers are enabled
    const enabledProviders = availableProviders.filter(
      (provider) => provider.enabled && aiProviderSettings[provider.id]
    );

    if (enabledProviders.length === 0) {
      const errorMessage: ChatMessage = {
        id: `no-providers-${Date.now()}`,
        text: "No AI assistants are currently enabled. Please enable at least one AI provider in Settings.",
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

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Add loading indicators for enabled AI providers only
    const loadingMessages: ChatMessage[] = enabledProviders.map((provider) => ({
      id: `${provider.id}-loading-${Date.now()}`,
      text: "Thinking...",
      sender: provider.id,
      timestamp: Date.now(),
      isLoading: true,
    }));

    setMessages((prev) => [...prev, ...loadingMessages]);

    try {
      const aiResponses = await aiService.askMultipleAIs(
        inputText.trim(),
        walletData,
        aiProviderSettings
      );

      // Filter responses to only include enabled providers
      const filteredResponses = aiResponses.filter(
        (response) => aiProviderSettings[response.sender as "openai" | "gemini"]
      );

      // Filter out loading messages and add real responses
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        return [...withoutLoading, ...filteredResponses];
      });
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
          <ThemedText style={styles.headerTitle}>AI Security Chat</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {
              availableProviders.filter(
                (p) => p.enabled && aiProviderSettings[p.id]
              ).length
            }{" "}
            AI assistants ready to help
          </ThemedText>
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
              placeholder="Ask ."
              placeholderTextColor="rgba(192, 230, 255, 0.6)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.disabledButton,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
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
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 162, 255, 0.1)",
    backgroundColor: "rgba(1, 24, 41, 0.8)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    color: SuiColors.aqua,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 20,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: SuiColors.sea,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
