
import React, { useState, useEffect, useMemo } from 'react';
import { ttsManager } from '../utils/ttsManager.ts';
import ModalComponent from './ModalComponent.tsx';

interface TTSModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

const TTSModalComponent: React.FC<TTSModalComponentProps> = ({ isOpen, onClose }) => {
  const [narrating, setNarrating] = useState(ttsManager.isNarrating());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(ttsManager.getCurrentVoice()?.voiceURI || '');
  const [selectedLang, setSelectedLang] = useState(ttsManager.getCurrentVoice()?.lang || 'en-US');

  useEffect(() => {
    const updateState = () => {
      setNarrating(ttsManager.isNarrating());
      const loadedVoices = ttsManager.getVoices();
      setVoices(loadedVoices);
      const currentVoice = ttsManager.getCurrentVoice();
      if (currentVoice) {
        setSelectedVoiceURI(currentVoice.voiceURI);
        setSelectedLang(currentVoice.lang);
      } else if (loadedVoices.length > 0) {
        const firstVoice = loadedVoices.find(v => v.lang.startsWith('en')) || loadedVoices[0];
        setSelectedLang(firstVoice.lang);
        setSelectedVoiceURI(firstVoice.voiceURI);
        ttsManager.setVoice(firstVoice.voiceURI);
      }
    };

    updateState();
    ttsManager.addListener(updateState);
    return () => ttsManager.removeListener(updateState);
  }, []);

  const handleToggleNarrating = () => {
    ttsManager.setNarrating(!narrating);
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    const firstVoiceForLang = voices.find(v => v.lang === newLang);
    if (firstVoiceForLang) {
      ttsManager.setVoice(firstVoiceForLang.voiceURI);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    ttsManager.setVoice(e.target.value);
  };
  
  const languageOptions = useMemo(() => {
    if (voices.length === 0) return [];
    const langMap = new Map<string, string>();
    const languageDisplayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    
    voices.forEach(voice => {
        if (!langMap.has(voice.lang)) {
            let name = voice.lang;
            try {
                const langCodeOnly = voice.lang.split('-')[0];
                const fullName = languageDisplayNames.of(langCodeOnly);
                name = fullName ? `${fullName} (${voice.lang})` : voice.lang;
            } catch { /* ignore */ }
            langMap.set(voice.lang, name);
        }
    });
    
    return Array.from(langMap.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [voices]);

  const voicesForSelectedLang = voices.filter(v => v.lang === selectedLang);

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Narration Settings"
      singleActionText="Close"
    >
      <div className="flex flex-col gap-4 font-['Special_Elite']">
        <div className="flex items-center justify-between p-2 border-b border-dashed border-[var(--border-color)]">
          <label htmlFor="tts-narrating-modal" className="text-lg">Narrate Game Events</label>
           <input
            id="tts-narrating-modal"
            type="checkbox"
            checked={narrating}
            onChange={handleToggleNarrating}
            className="w-6 h-6 accent-[var(--blood-red)]"
          />
        </div>

        <div className={`flex flex-col gap-4 transition-opacity ${!narrating ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col gap-2">
              <label htmlFor="lang-select" className="text-md">Language:</label>
              <select
                id="lang-select"
                value={selectedLang}
                onChange={handleLangChange}
                className="p-2 border border-[var(--border-color)] rounded bg-white text-[var(--ink-main)]"
                disabled={!narrating}
              >
                {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="voice-select" className="text-md">Voice:</label>
              <select
                id="voice-select"
                value={selectedVoiceURI}
                onChange={handleVoiceChange}
                className="p-2 border border-[var(--border-color)] rounded bg-white text-[var(--ink-main)]"
                disabled={!narrating || voicesForSelectedLang.length === 0}
              >
                {voicesForSelectedLang.map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>
                ))}
              </select>
            </div>
            <button
                onClick={() => ttsManager.speak("Howdy partner! This is a test of the selected voice.")}
                className="button mt-2"
                disabled={!narrating}
            >
                Test Voice
            </button>
          </div>
      </div>
    </ModalComponent>
  );
};

export default TTSModalComponent;
