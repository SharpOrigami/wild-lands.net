type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'incoming_attack' | 'special_event' | 'victory';

const patterns: Record<HapticPattern, number | number[]> = {
    light: 20,
    medium: 50,
    heavy: [100, 30, 100],
    success: [50, 100, 50],
    error: [75, 50, 75],
    incoming_attack: [75, 40, 75], // A sharper, shorter pulse for taking damage
    special_event: [200, 70, 200], // A longer, more dramatic vibration for major events
    victory: [100, 50, 100, 50, 200],
};

class HapticManager {
    private isEnabled: boolean = true;
    private listeners: Set<() => void> = new Set();

    constructor() {
        this.loadSettings();
    }

    private loadSettings() {
        const stored = localStorage.getItem('wildWestHapticsEnabled_WWS');
        this.isEnabled = stored === null ? true : stored === 'true';
    }

    private saveSettings() {
        localStorage.setItem('wildWestHapticsEnabled_WWS', String(this.isEnabled));
    }
    
    public addListener(listener: () => void) {
        this.listeners.add(listener);
    }

    public removeListener(listener: () => void) {
        this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener());
    }

    public getIsEnabled = () => this.isEnabled;

    public setIsEnabled(status: boolean) {
        if (this.isEnabled !== status) {
            this.isEnabled = status;
            this.saveSettings();
            if (status) {
                this.trigger('light'); // Give feedback on enable
            }
            this.notifyListeners();
        }
    }

    public trigger(pattern: HapticPattern): void {
        if (!this.isEnabled) return;

        if ('vibrate' in navigator && navigator.vibrate) {
            try {
                navigator.vibrate(patterns[pattern]);
            } catch (e) {
                console.warn("Could not trigger haptic feedback:", e);
            }
        }
    }
}

export const hapticManager = new HapticManager();
