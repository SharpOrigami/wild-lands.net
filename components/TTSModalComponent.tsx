import React, { useState, useEffect, useMemo } from 'react';
import { ttsManager } from '../utils/ttsManager';
import ModalComponent from './ModalComponent';

interface TTSModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

const TTSModalComponent: React.FC<TTSModalComponentProps> = ({ isOpen, onClose }) => {
  const [narrating, setNarrating] = useState(ttsManager.isNarrating());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(ttsManager.getCurrentVoice()?.voiceURI || '');
  const [selectedLangCode, setSelectedLangCode] = useState(ttsManager.getCurrentVoice()?.lang.split(/[-_]/)[0] || 'en');

  useEffect(() => {
    const updateState = () => {
      setNarrating(ttsManager.isNarrating());
      const loadedVoices = ttsManager.getVoices();
      setVoices(loadedVoices);
      const currentVoice = ttsManager.getCurrentVoice();
      if (currentVoice) {
        setSelectedVoiceURI(currentVoice.voiceURI);
        setSelectedLangCode(currentVoice.lang.split(/[-_]/)[0]);
      } else if (loadedVoices.length > 0) {
        const firstVoice = loadedVoices.find(v => v.lang.startsWith('en')) || loadedVoices[0];
        setSelectedLangCode(firstVoice.lang.split(/[-_]/)[0]);
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
    const newLangCode = e.target.value;
    setSelectedLangCode(newLangCode);
    const firstVoiceForLang = voices.find(v => v.lang.startsWith(newLangCode));
    if (firstVoiceForLang) {
      ttsManager.setVoice(firstVoiceForLang.voiceURI);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    ttsManager.setVoice(e.target.value);
  };
  
  const languageOptions = useMemo(() => {
    if (voices.length === 0) return [];
    const langCodes = Array.from(new Set(voices.map(v => v.lang.split(/[-_]/)[0])));
    const languageDisplayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    
    return langCodes.map(code => {
        let name = code;
        try {
            const fullName = languageDisplayNames.of(code);
            name = fullName ? fullName.charAt(0).toUpperCase() + fullName.slice(1) : code;
        } catch {
            // Ignore errors for non-standard codes
        }
        return { code, name };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [voices]);

  const voicesForSelectedLang = voices.filter(v => v.lang.startsWith(selectedLangCode));

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

        <div className={`flex flex-col gap-4 animate-fade-in transition-opacity ${!narrating ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col gap-2">
              <label htmlFor="lang-select" className="text-md">Language:</label>
              <select
                id="lang-select"
                value={selectedLangCode}
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
                  <option key={voice.voiceURI} value={voice.voiceURI}>{`${voice.name} (${voice.lang})`}</option>
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