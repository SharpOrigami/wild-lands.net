
import { getCacheBustedUrl } from './cardUtils.ts';
import * as allSounds from '../assets/sounds/index.ts';
import { hapticManager } from './hapticUtils.ts';

const SFX_POOL_SIZE = 12;

const allSoundMaps = {
    common: allSounds.COMMON_SOUNDS,
    western: { ...allSounds.WESTERN_SOUNDS, ...allSounds.WESTERN_ANIMAL_SOUNDS },
    japan: { ...allSounds.JAPAN_SOUNDS, ...allSounds.JAPAN_ANIMAL_SOUNDS },
    africa: { ...allSounds.AFRICA_SOUNDS, ...allSounds.AFRICA_ANIMAL_SOUNDS },
    horror: { ...allSounds.HORROR_SOUNDS, ...allSounds.HORROR_ANIMAL_SOUNDS },
    cyberpunk: { ...allSounds.CYBERPUNK_SOUNDS, ...allSounds.CYBERPUNK_ANIMAL_SOUNDS },
};

export type ThemeName = keyof typeof allSoundMaps;
export const ALL_THEMES = Object.keys(allSoundMaps) as ThemeName[];

class SoundManager {
  private musicAudio: HTMLAudioElement | null = null;
  private sfxPool: HTMLAudioElement[] = [];
  private sfxIndex = 0;
  
  private musicVolume = 0.3; // UI slider value (0-1)
  private sfxVolume = 0.6;   // UI slider value (0-1)
  private isMusicMuted = false;
  private isSfxMuted = false;
  private isInitialized = false;
  private isAudioUnlocked = false;

  private currentMusic: string | null = null;
  private isPlayingMusic = false;
  private queuedMusicRequest: string | null = null;
  
  private preloadedUrls = new Set<string>();
  private assetTimeout = 300000; // 5 minutes
  
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  public addListener(listener: () => void) { this.listeners.add(listener); }
  public removeListener(listener: () => void) { this.listeners.delete(listener); }
  private notifyListeners() { this.listeners.forEach(listener => listener()); }

  public async init() {
    if (this.isInitialized) return;
    
    this.musicAudio = new Audio();
    this.musicAudio.loop = true;
    
    for (let i = 0; i < SFX_POOL_SIZE; i++) {
      this.sfxPool.push(new Audio());
    }
    
    this.applyInitialSettings();
    this.isInitialized = true;
    
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.addEventListener('pagehide', this.handlePageHide.bind(this)); // Add handler for page dismissal
  }

  private applyInitialSettings() {
    if (!this.isInitialized || !this.musicAudio) return;
    this.musicAudio.volume = this.musicVolume * 0.5; // Scale to 0-0.5
    this.musicAudio.muted = this.isMusicMuted;
    this.sfxPool.forEach(sfx => {
        sfx.volume = this.sfxVolume;
    });
  }

  private unlockAudioAndPlayQueuedMusic() {
    if (this.isAudioUnlocked) return;
    this.isAudioUnlocked = true;
    console.log("Audio context unlocked by successful SFX playback.");

    if (this.queuedMusicRequest) {
        const name = this.queuedMusicRequest;
        this.queuedMusicRequest = null;
        this.playMusic(name);
    }
  }

  private handlePageHide() {
    if (this.musicAudio && this.isPlayingMusic) {
      this.musicAudio.pause();
    }
  }

  private handleVisibilityChange() {
    if (!this.isInitialized || !this.musicAudio) return;

    if (document.hidden) {
      if (this.isPlayingMusic && this.musicAudio && !this.musicAudio.paused) {
        this.musicAudio.pause();
      }
    } else {
      if (this.musicAudio.paused && this.currentMusic) {
        this.musicAudio.volume = this.isMusicMuted ? 0 : this.musicVolume * 0.5;
        this.musicAudio.play().catch(e => console.error("Error resuming music on visibility change:", e));
      }
    }
  }

  public getUrlsForThemes(themes: ThemeName[]): string[] {
      const urls = new Set<string>();
      themes.forEach(theme => {
          const soundMap = allSoundMaps[theme];
          if (soundMap) {
              Object.values(soundMap).forEach(url => url && urls.add(url));
          }
      });
      return Array.from(urls);
  }

  public async preloadBatch(urls: string[], onAssetLoaded?: () => void) {
      const urlsToProcess = urls.filter(url => url && !this.preloadedUrls.has(url));
       if (urlsToProcess.length === 0) {
            if (onAssetLoaded) urls.forEach(() => onAssetLoaded());
            return;
        }

      let successfulLoads = 0;
      
      const allPromises = urlsToProcess.map(url => 
          new Promise<void>(resolve => {
              const audio = new Audio();

              const onDataLoaded = () => {
                  this.preloadedUrls.add(url);
                  successfulLoads++;
                  cleanup();
                  if (onAssetLoaded) onAssetLoaded();
                  resolve();
              };
              
              const onError = (e: Event | string) => {
                  let detail = "Unknown error.";
                  if (typeof e === 'string') {
                    detail = e;
                  } else if (e instanceof Event && e.target) {
                    const target = e.target as HTMLAudioElement;
                    if(target.error) {
                      detail = `Code ${target.error.code}: ${target.error.message}`;
                    }
                  }
                  console.error(`Error preloading sound: ${url} - ${detail}`);
                  cleanup();
                  if (onAssetLoaded) onAssetLoaded();
                  resolve();
              };
              
              const onTimeout = () => {
                  console.warn(`Timeout preloading sound: ${url}`);
                  cleanup();
                  if (onAssetLoaded) onAssetLoaded();
                  resolve();
              };

              const timeoutId = setTimeout(onTimeout, this.assetTimeout);

              const cleanup = () => {
                  audio.removeEventListener('loadeddata', onDataLoaded);
                  audio.removeEventListener('error', onError as EventListener);
                  clearTimeout(timeoutId);
                  audio.src = ''; 
              };

              audio.addEventListener('loadeddata', onDataLoaded, { once: true });
              audio.addEventListener('error', onError as EventListener, { once: true });

              audio.src = getCacheBustedUrl(url);
              audio.load();
          })
      );

      await Promise.all(allPromises);

      if (successfulLoads > 0) {
        console.log(`${successfulLoads}/${urlsToProcess.length} new sound assets loaded.`);
      }
  }

  public async preloadThemes(themes: ThemeName[], onAssetLoaded?: () => void) {
      if (!this.isInitialized) await this.init();
      const urlsToLoad = this.getUrlsForThemes(themes);
      await this.preloadBatch(urlsToLoad, onAssetLoaded);
  }

  public isPreloaded(url: string): boolean {
    return this.preloadedUrls.has(url);
  }

  private loadSettings() {
    this.musicVolume = parseFloat(localStorage.getItem('wildWestMusicVolume_WWS') || '0.3');
    this.sfxVolume = parseFloat(localStorage.getItem('wildWestSfxVolume_WWS') || '0.6');
    this.isMusicMuted = localStorage.getItem('wildWestMusicMuted_WWS') === 'true';
    this.isSfxMuted = localStorage.getItem('wildWestSfxMuted_WWS') === 'true';
  }

  private saveSettings() {
    localStorage.setItem('wildWestMusicVolume_WWS', this.musicVolume.toString());
    localStorage.setItem('wildWestSfxVolume_WWS', this.sfxVolume.toString());
    localStorage.setItem('wildWestMusicMuted_WWS', this.isMusicMuted.toString());
    localStorage.setItem('wildWestSfxMuted_WWS', this.isSfxMuted.toString());
  }

  public playSound(name: string) {
    if (!this.isInitialized || this.isSfxMuted) return;

    if (name === 'ui_button_click' || name === 'card_click') hapticManager.trigger('light');
    else if (name === 'card_play') hapticManager.trigger('medium');
    else if (name === 'lightning_strike' || name.startsWith('threat_skunk_t1')) hapticManager.trigger('special_event');
    else if (name.includes('gun') || name.includes('rifle') || name.includes('shooter')) hapticManager.trigger('heavy');
    else if (name.includes('knife') || name.includes('blade') || name.includes('katana') || name.includes('sword') || name.includes('wakizashi') || name.includes('tsurugi') || name.includes('uchigatana') || name.includes('nodachi')) hapticManager.trigger('light');
    else if (name.includes('bow')) hapticManager.trigger('medium');
    else if (name === 'player_hurt') hapticManager.trigger('incoming_attack');
    else if (name === 'heal') hapticManager.trigger('success');
    else if (name === 'gold') hapticManager.trigger('medium');
    else if (name === 'trap_snap') hapticManager.trigger('heavy');
    else if (name === 'threat_reveal') hapticManager.trigger('error');
    else if (name === 'victory_sting') hapticManager.trigger('victory');
    else if (name === 'enemy_hurt') hapticManager.trigger('medium');
  
    let url = allSounds.SOUND_ASSETS[name as keyof typeof allSounds.SOUND_ASSETS];
  
    if (url === '') return;

    if (!url) {
      if (name.includes('six_iron')) {
          url = allSounds.SOUND_ASSETS['item_six_iron_t2'];
      } else if (name.includes('six_shooter') || name.includes('revolver')) {
          url = allSounds.SOUND_ASSETS['item_six_shooter_t1'];
      } else if (name.includes('hunting_rifle') || name.includes('elephant_gun')) {
          url = allSounds.SOUND_ASSETS['item_hunting_rifle_t1'];
      } else if (name.includes('rifle')) {
          url = allSounds.SOUND_ASSETS['item_rifle_t1'];
      } else if (name.includes('sawed_off') || name.includes('shotgun')) {
          url = allSounds.SOUND_ASSETS['item_sawed_off_t1'];
      } else if (name.includes('bow')) {
          url = allSounds.SOUND_ASSETS['item_bow_t1'];
      } else if (name.includes('knife') || name.includes('katana') || name.includes('machete') || name.includes('sword') || name.includes('wakizashi') || name.includes('tsurugi') || name.includes('uchigatana') || name.includes('nodachi')) {
          url = allSounds.SOUND_ASSETS['blade_slice'];
      } else if (name.includes('trick_shot') || name.includes('aimed_shot')) {
          url = allSounds.SOUND_ASSETS['gunshot'];
      } else if (name.includes('fire_arrow') || name.includes('poisoned_arrow')) {
          url = allSounds.SOUND_ASSETS['bow_shot'];
      }
    }
  
    if (!url) {
      if (name.startsWith('threat_')) return;
      console.warn(`Sound not found for ID: ${name}`);
      return;
    }
  
    const sfx = this.sfxPool[this.sfxIndex];
    this.sfxIndex = (this.sfxIndex + 1) % SFX_POOL_SIZE;
  
    sfx.src = getCacheBustedUrl(url);
    sfx.volume = this.sfxVolume;
    
    const playPromise = sfx.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            if (!this.isAudioUnlocked) {
                this.unlockAudioAndPlayQueuedMusic();
            }
        }).catch(e => {
            console.error(`Error playing sound "${name}":`, e);
        });
    }
  }

  public playMusic(name: string) {
    if (!this.isInitialized || !this.musicAudio) return;

    if (!this.isAudioUnlocked) {
        this.queuedMusicRequest = name;
        return;
    }

    // If the requested music is already the current one, just handle its paused state.
    if (this.currentMusic === name) {
        if (this.musicAudio.paused) {
            const playPromise = this.musicAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => { this.isPlayingMusic = true; })
                .catch(e => console.error(`Error resuming music "${name}":`, e));
            }
        }
        // If it's already playing, do nothing.
        return;
    }

    // If we are here, it's a new song.
    const url = allSounds.SOUND_ASSETS[name as keyof typeof allSounds.SOUND_ASSETS];
    if (!url) {
        console.warn(`Music not found: ${name}`);
        this.stopMusic();
        return;
    }
    
    this.currentMusic = name;
    this.musicAudio.src = getCacheBustedUrl(url);
    this.musicAudio.volume = this.musicVolume * 0.5;
    this.musicAudio.muted = this.isMusicMuted;

    const playPromise = this.musicAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            this.isPlayingMusic = true;
        }).catch(error => {
            if (error.name !== 'AbortError') {
                console.error(`Error playing music "${name}":`, error);
                this.currentMusic = null;
                this.isPlayingMusic = false;
            }
        });
    }
  }

  public stopMusic() {
    if (!this.isInitialized || !this.musicAudio) return;
    
    this.musicAudio.pause();
    this.currentMusic = null;
    this.isPlayingMusic = false;
  }
  
  public setMusicVolume(volume: number) { // volume is 0-1
    if (!this.isInitialized) return;
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume * 0.5;
    }
    this.saveSettings();
    this.notifyListeners();
  }

  public setSfxVolume(volume: number) { // volume is 0-1
    if (!this.isInitialized) return;
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (!this.isSfxMuted) this.playSound('ui_button_click');
    this.saveSettings();
    this.notifyListeners();
  }
  
  public setMusicMuted(muted: boolean) {
    if (!this.isInitialized) return;
    this.isMusicMuted = muted;
    if (this.musicAudio) {
        this.musicAudio.muted = muted;
    }
    if(!muted) this.playSound('ui_button_click');
    this.saveSettings();
    this.notifyListeners();
  }

  public setSfxMuted(muted: boolean) {
    if (!this.isInitialized) return;
    this.isSfxMuted = muted;
    if (!muted) this.playSound('ui_button_click');
    this.saveSettings();
    this.notifyListeners();
  }

  public dimMusic(factor = 0.5) {
    if (this.musicAudio && !this.isMusicMuted) {
        this.musicAudio.volume = (this.musicVolume * 0.5) * factor;
    }
  }

  public undimMusic() {
    if (this.musicAudio && !this.isMusicMuted) {
        this.musicAudio.volume = this.musicVolume * 0.5;
    }
  }

  public getMusicVolume = () => this.musicVolume;
  public getSfxVolume = () => this.sfxVolume;
  public getIsMusicMuted = () => this.isMusicMuted;
  public getIsSfxMuted = () => this.isSfxMuted;
}

export const soundManager = new SoundManager();
