import { soundManager } from './soundManager.ts';

class TTSManager {
    private narrating: boolean = false;
    private synthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private currentVoiceURI: string | null = null;
    private volume: number = 1.0;
    private listeners: Set<() => void> = new Set();

    private messageQueue: string[] = [];
    private isSpeaking: boolean = false;
    private isLockedForStory: boolean = false;
    private currentStoryOnEnd: (() => void) | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private isUnlocked = false;

    constructor() {
        this.synthesis = window.speechSynthesis;
        this.loadSettings();
        if (this.synthesis.getVoices().length > 0) {
            this.loadVoices();
        } else {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    private loadVoices() {
        this.voices = this.synthesis.getVoices().sort((a, b) => a.name.localeCompare(b.name));
        const storedVoiceURI = localStorage.getItem('wildWestTTSVoice_WWS');
        if (storedVoiceURI && this.voices.some(v => v.voiceURI === storedVoiceURI)) {
            this.currentVoiceURI = storedVoiceURI;
        } else if (this.voices.length > 0) {
            const defaultVoice = this.voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
            if (defaultVoice) {
                this.currentVoiceURI = defaultVoice.voiceURI;
            }
        }
        this.notifyListeners();
    }

    private loadSettings() {
        this.narrating = localStorage.getItem('wildWestTTSNarrating_WWS') === 'true'; // Defaults to false
        this.volume = parseFloat(localStorage.getItem('wildWestTTSVolume_WWS') || '1.0');
    }

    private saveSettings() {
        localStorage.setItem('wildWestTTSNarrating_WWS', String(this.narrating));
        localStorage.setItem('wildWestTTSVolume_WWS', String(this.volume));
        if (this.currentVoiceURI) {
            localStorage.setItem('wildWestTTSVoice_WWS', this.currentVoiceURI);
        }
    }

    public addListener(listener: () => void) { this.listeners.add(listener); }
    public removeListener(listener: () => void) { this.listeners.delete(listener); }
    private notifyListeners() { this.listeners.forEach(listener => listener()); }

    public unlock() {
        if (this.isUnlocked || !this.synthesis) {
            return;
        }

        // If the synth is already active for any reason, we're unlocked.
        if (this.synthesis.speaking || this.synthesis.pending) {
            this.isUnlocked = true;
            return;
        }

        // Create a silent utterance to kickstart the synthesis engine.
        // This must be called synchronously inside a user gesture event handler (e.g., a click).
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        
        // We don't wait for this to finish. Its only job is to break the ice.
        // The first real call to speak() will cancel this if it's still in the queue.
        this.synthesis.speak(utterance);
        
        this.isUnlocked = true;
        console.log("TTS context unlock attempted.");
    }

    private processQueue() {
        if (this.isSpeaking || this.messageQueue.length === 0 || !this.narrating) {
            if (!this.isSpeaking && this.messageQueue.length === 0) {
                soundManager.undimMusic();
                if (this.isLockedForStory) {
                    this.isLockedForStory = false;
                    if (this.currentStoryOnEnd) {
                        this.currentStoryOnEnd();
                        this.currentStoryOnEnd = null;
                    }
                }
            }
            return;
        }

        this.isSpeaking = true;
        soundManager.dimMusic();

        const text = this.messageQueue.shift()!;
        const utterance = this.createUtterance(text);
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    private createUtterance(text: string): SpeechSynthesisUtterance {
        if (this.voices.length === 0) {
            this.loadVoices(); // Defensive reload
        }
        const selectedVoice = this.voices.find(v => v.voiceURI === this.currentVoiceURI);
        const utterance = new SpeechSynthesisUtterance(text.trim());

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }
        utterance.volume = this.volume;
        utterance.rate = 1;
        utterance.pitch = 1;

        const onEndOrError = () => {
            if (this.currentUtterance === utterance) {
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.processQueue();
            }
        };

        utterance.onend = onEndOrError;
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            if (event.error !== 'canceled' && event.error !== 'interrupted') {
                console.error('SpeechSynthesisUtterance.onerror:', event.error, `Text: "${utterance.text}"`);
            }
            onEndOrError();
        };

        return utterance;
    }

    public speak(text: string, onEnd?: () => void) {
        if (!this.narrating || !text) {
            if (onEnd) onEnd();
            return;
        }
        this.cancel();
        this.isLockedForStory = true;
        this.currentStoryOnEnd = onEnd || null;
        this.messageQueue = text.split(/\n+/).filter(p => p.trim().length > 0);
        this.processQueue();
    }

    public speakLogs(messages: string[]) {
        if (!this.narrating || messages.length === 0 || this.isLockedForStory) {
            return;
        }
        // ONLY cancel if something is actively speaking.
        // This prevents canceling an idle engine, which can cause errors on mobile.
        if (this.synthesis.speaking) {
            this.cancel();
        }
        this.messageQueue = messages;
        this.processQueue();
    }

    public cancel() {
        this.unlockNarration();
        this.messageQueue = [];
        if (this.currentUtterance) {
            this.currentUtterance.onend = null;
            this.currentUtterance.onerror = null;
        }
        this.currentUtterance = null;
        if (this.synthesis.speaking || this.synthesis.pending) {
            this.synthesis.cancel();
        }
        this.isSpeaking = false;
        soundManager.undimMusic();
    }

    public isNarrationLocked = (): boolean => this.isLockedForStory;

    public unlockNarration() {
        this.isLockedForStory = false;
        this.currentStoryOnEnd = null;
    }

    public isNarrating = () => this.narrating;
    public setNarrating(status: boolean) {
        this.narrating = status;
        if (!status) {
            this.cancel();
        }
        this.saveSettings();
        this.notifyListeners();
    }
    
    public getVolume = () => this.volume;
    public setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        this.notifyListeners();
    }
    
    public getVoices = () => this.voices;
    public getLanguages = () => {
        const langSet = new Set(this.voices.map(v => v.lang));
        return Array.from(langSet).sort();
    }
    public getCurrentVoice = () => this.voices.find(v => v.voiceURI === this.currentVoiceURI);
    public setVoice(voiceURI: string) {
        if (this.voices.some(v => v.voiceURI === voiceURI)) {
            this.currentVoiceURI = voiceURI;
            this.saveSettings();
            this.notifyListeners();
        }
    }
}

export const ttsManager = new TTSManager();