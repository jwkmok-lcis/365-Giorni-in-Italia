// VoicePronunciationSystem – evaluates player speech for pronunciation and grammar accuracy.
// Uses Web Speech API for speech recognition and provides feedback.

export class VoicePronunciationSystem {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.currentTarget = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;

    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    // Check for browser support (only available in browser environment)
    if (typeof window === 'undefined') {
      console.warn("Speech recognition not available in Node.js environment");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'it-IT'; // Italian

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      this.processSpeechResult(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  // Start listening for speech input
  startListening(targetText, onResult, onError) {
    if (!this.recognition || this.isListening) return false;

    this.currentTarget = targetText.toLowerCase().trim();
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Process speech recognition result
  processSpeechResult(transcript) {
    if (!this.currentTarget) return;

    const evaluation = this.evaluateSpeech(transcript, this.currentTarget);

    if (this.onResultCallback) {
      this.onResultCallback({
        transcript,
        target: this.currentTarget,
        ...evaluation
      });
    }

    this.currentTarget = null;
  }

  // Evaluate speech accuracy
  evaluateSpeech(transcript, target) {
    // Basic evaluation metrics
    const accuracy = this.calculateAccuracy(transcript, target);
    const grammarScore = this.evaluateGrammar(transcript, target);
    const pronunciationScore = this.evaluatePronunciation(transcript, target);

    // Overall score (weighted average)
    const overallScore = (accuracy * 0.4) + (grammarScore * 0.4) + (pronunciationScore * 0.2);

    // Generate feedback
    const feedback = this.generateFeedback(accuracy, grammarScore, pronunciationScore);

    return {
      accuracy,
      grammarScore,
      pronunciationScore,
      overallScore,
      feedback,
      passed: overallScore >= 0.6 // 60% threshold for passing
    };
  }

  // Calculate basic accuracy (word matching)
  calculateAccuracy(transcript, target) {
    const transcriptWords = transcript.split(/\s+/);
    const targetWords = target.split(/\s+/);

    let matches = 0;
    transcriptWords.forEach(word => {
      if (targetWords.includes(word)) matches++;
    });

    return Math.min(matches / targetWords.length, 1.0);
  }

  // Evaluate grammar (word order, key structures)
  evaluateGrammar(transcript, target) {
    // Simple grammar checks
    let score = 0;
    let checks = 0;

    // Check if key verbs are present and in correct form
    const verbPatterns = [
      /\b(ho|hai|ha|abbiamo|avete|hanno)\s+\w+to\b/, // Past tense
      /\b(sto|stai|sta|stiamo|state|stanno)\s+\w+ndo\b/, // Present continuous
      /\b(voglio|vuoi|vuole|vogliamo|volete|vogliono)\b/, // Modal verbs
      /\b(posso|puoi|può|possiamo|potete|possono)\b/,
      /\b(devo|devi|deve|dobbiamo|dovete|devono)\b/
    ];

    verbPatterns.forEach(pattern => {
      if (pattern.test(target)) {
        checks++;
        if (pattern.test(transcript)) score++;
      }
    });

    // Check pronoun usage
    const pronounPatterns = [
      /\b(lo|la|li|le|gli|ne)\b/,
      /\b(mi|ti|ci|vi|si)\b/
    ];

    pronounPatterns.forEach(pattern => {
      if (pattern.test(target)) {
        checks++;
        if (pattern.test(transcript)) score++;
      }
    });

    return checks > 0 ? score / checks : 0.8; // Default good score if no specific checks
  }

  // Evaluate pronunciation (basic heuristics)
  evaluatePronunciation(transcript, target) {
    // This is a simplified version - real implementation would use phoneme analysis
    const transcriptLength = transcript.length;
    const targetLength = target.length;

    // Length similarity (rough proxy for completeness)
    const lengthRatio = Math.min(transcriptLength / targetLength, targetLength / transcriptLength);

    // Word count similarity
    const transcriptWords = transcript.split(/\s+/).length;
    const targetWords = target.split(/\s+/).length;
    const wordRatio = Math.min(transcriptWords / targetWords, targetWords / transcriptWords);

    return (lengthRatio + wordRatio) / 2;
  }

  // Generate user-friendly feedback
  generateFeedback(accuracy, grammarScore, pronunciationScore) {
    const feedback = {
      message: "",
      suggestions: [],
      emoji: ""
    };

    const overallScore = (accuracy + grammarScore + pronunciationScore) / 3;

    if (overallScore >= 0.8) {
      feedback.message = "Ottimo! Perfetto!";
      feedback.emoji = "✅";
    } else if (overallScore >= 0.6) {
      feedback.message = "Bene! Quasi corretto.";
      feedback.emoji = "👍";
    } else if (overallScore >= 0.4) {
      feedback.message = "Buon tentativo! Continua così.";
      feedback.emoji = "👏";
    } else {
      feedback.message = "Riprova! Puoi farcela.";
      feedback.emoji = "💪";
    }

    // Specific suggestions
    if (grammarScore < 0.6) {
      feedback.suggestions.push("Controlla l'ordine delle parole");
    }

    if (accuracy < 0.7) {
      feedback.suggestions.push("Ascolta di nuovo e ripeti");
    }

    if (pronunciationScore < 0.6) {
      feedback.suggestions.push("Pronuncia lentamente ogni parola");
    }

    return feedback;
  }

  // Get retry bonus XP
  getRetryBonus(attemptNumber) {
    // Small bonus for persistence
    return Math.min(attemptNumber * 2, 6); // Max 6 XP bonus
  }

  // Check if speech recognition is available
  isAvailable() {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Get supported languages (for future expansion)
  getSupportedLanguages() {
    return ['it-IT', 'en-US', 'es-ES', 'fr-FR'];
  }
}