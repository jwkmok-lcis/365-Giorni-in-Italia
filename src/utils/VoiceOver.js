// VoiceOver – lightweight browser TTS helper for dialogue playback.
// Uses Web Speech API when available; no-op fallback when unsupported.

export class VoiceOver {
  constructor() {
    this.muted = false;
    this.defaultLang = "it-IT";
    this.defaultRate = 0.8;
    this.defaultPitch = 1.0;
    this.defaultVolume = 1.0;
    this.strictItalian = false;
    this._voices = [];
    this._unlocked = false;
    this._speaking = false;

    if (this.isSupported()) {
      this._voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this._voices = window.speechSynthesis.getVoices();
      };
    }
  }

  isSupported() {
    return typeof window !== "undefined"
      && "speechSynthesis" in window
      && typeof window.SpeechSynthesisUtterance === "function";
  }

  speak(text, options = {}) {
    if (!this.isSupported()) return { ok: false, reason: "unsupported" };
    if (this.muted) return { ok: false, reason: "muted" };
    if (!text || !String(text).trim()) return { ok: false, reason: "empty-text" };
    if ((options.requireUnlock ?? true) && !this._unlocked) {
      return { ok: false, reason: "locked" };
    }

    const lang = options.lang ?? this.defaultLang;
    const preferredVoice = this._selectBestVoice(lang);

    if (!preferredVoice && (options.strictItalian ?? this.strictItalian)) {
      return { ok: false, reason: "no-italian-voice" };
    }

    const synthesis = window.speechSynthesis;

    // Chrome workaround: always cancel + resume + wait a tick before speaking.
    // Without this, Chrome can fire onstart but produce no audio.
    synthesis.cancel();
    synthesis.resume();

    const self = this;

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.lang = preferredVoice?.lang ?? lang;
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = options.rate ?? self.defaultRate;
      utterance.pitch = options.pitch ?? self.defaultPitch;
      utterance.volume = options.volume ?? self.defaultVolume;
      utterance.onstart = () => {
        self._unlocked = true;
        self._speaking = true;
      };
      utterance.onerror = () => {
        self._speaking = false;
      };
      utterance.onend = () => {
        self._speaking = false;
      };

      synthesis.speak(utterance);

      // Chrome 15-second bug workaround: periodically resume to keep speech alive.
      const keepAlive = setInterval(() => {
        if (!self._speaking) { clearInterval(keepAlive); return; }
        synthesis.pause();
        synthesis.resume();
      }, 5000);
    }, 100);

    return {
      ok: true,
      voiceName: preferredVoice?.name ?? "browser-default",
      voiceLang: preferredVoice?.lang ?? lang
    };
  }

  /** Whether speech is currently playing. */
  isSpeaking() {
    return this._speaking;
  }

  unlockFromGesture() {
    if (!this.isSupported()) return { ok: false, reason: "unsupported" };
    this._unlocked = true;
    return { ok: true, unlocked: true };
  }

  isUnlocked() {
    return this._unlocked;
  }

  stop() {
    if (!this.isSupported()) return;
    this._speaking = false;
    window.speechSynthesis.cancel();
  }

  setMuted(nextMuted) {
    this.muted = Boolean(nextMuted);
    if (this.muted) {
      this.stop();
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  hasItalianVoice() {
    return Boolean(this._selectBestVoice("it-IT"));
  }

  getItalianVoices() {
    const voices = this._voices.length ? this._voices : window.speechSynthesis.getVoices();
    return (voices ?? [])
      .filter((v) => String(v.lang).toLowerCase().startsWith("it"))
      .map((v) => ({ name: v.name, lang: v.lang, default: Boolean(v.default) }));
  }

  getVoiceSummary() {
    const voices = this._voices.length ? this._voices : window.speechSynthesis.getVoices();
    return {
      total: voices?.length ?? 0,
      italian: this.getItalianVoices().length
    };
  }

  _selectBestVoice(lang) {
    const voices = this._voices.length ? this._voices : window.speechSynthesis.getVoices();
    if (!voices?.length) return null;

    const normalized = String(lang || this.defaultLang).toLowerCase();

    // 1) Exact language match (it-IT)
    const exact = voices.find((v) => String(v.lang).toLowerCase() === normalized);
    if (exact) return exact;

    // 2) Same language family (it)
    const family = normalized.split("-")[0];
    const familyMatches = voices.filter((v) => String(v.lang).toLowerCase().startsWith(`${family}-`) || String(v.lang).toLowerCase() === family);
    if (!familyMatches.length) return null;

    // 3) Prefer high-quality/common Italian voices
    const scored = familyMatches
      .map((v) => {
        const name = String(v.name).toLowerCase();
        let score = 0;
        if (name.includes("google")) score += 3;
        if (name.includes("microsoft")) score += 2;
        if (name.includes("elsa") || name.includes("cosimo") || name.includes("ital")) score += 2;
        if (v.default) score += 1;
        return { v, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored[0]?.v ?? familyMatches[0];
  }
}
