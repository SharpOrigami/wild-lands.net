import React, { useEffect, useRef, useMemo } from 'react';
import { LogEntry } from '../types.ts';
import { MAX_LOG_ENTRIES } from '../constants.ts';
import { ttsManager } from '../utils/ttsManager.ts';

interface GameLogProps {
  logEntries: LogEntry[];
}

const GameLogComponent: React.FC<GameLogProps> = ({ logEntries }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const prevLogEntriesRef = useRef<LogEntry[]>([]);
  const isInitialMountRef = useRef(true);
  const isNarrationOnRef = useRef(ttsManager.isNarrating());

  const displayedEntries = useMemo(() => {
    const uniqueLogEntries: LogEntry[] = [];
    const seenLogKeys = new Set<string>();

    for (const entry of logEntries) {
        const time = new Date(entry.timestamp);
        const key = `${entry.message}_${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;
        if (!seenLogKeys.has(key)) {
            uniqueLogEntries.push(entry);
            seenLogKeys.add(key);
        }
    }

    return uniqueLogEntries
      .filter(entry => {
        if (entry.type === 'debug') return false;
        if (entry.type === 'system' || entry.type === 'info') {
          const lowerMessage = entry.message.toLowerCase();
          if (
            lowerMessage.includes('ng+ scaling') ||
            lowerMessage.includes('ai-remixed cards') ||
            lowerMessage.includes('ai card remixing') ||
            lowerMessage.includes('ai boss generation') ||
            lowerMessage.includes('prepared cards for ng+ carry-over') ||
            lowerMessage.includes('character name set to') ||
            lowerMessage.includes('selected.') || // For "Character X selected."
            lowerMessage.includes("was returned to the general store's stock") ||
            lowerMessage.includes('kit is packed and ready') ||
            lowerMessage.includes('ready to ride!') ||
            lowerMessage.includes("the hand's been dealt") ||
            lowerMessage.includes('autosave')
          ) {
            return false;
          }
        }
        return true;
      })
      .filter((entry, index, self) => {
        if (entry.message.includes('Generating intro story for')) {
            return self.findIndex(e => e.message.includes('Generating intro story for')) === index;
        }
        return true;
      })
      .slice(0, MAX_LOG_ENTRIES);
  }, [logEntries]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [displayedEntries[0]?.timestamp, displayedEntries[0]?.message]);

  useEffect(() => {
    const handleNarrationChange = () => {
        const isNowNarrating = ttsManager.isNarrating();
        if (isNowNarrating && !isNarrationOnRef.current) {
            if (displayedEntries.length > 0) {
                ttsManager.speak(displayedEntries[0].message);
            }
        }
        isNarrationOnRef.current = isNowNarrating;
    };

    ttsManager.addListener(handleNarrationChange);
    return () => ttsManager.removeListener(handleNarrationChange);
  }, [displayedEntries]);


  useEffect(() => {
    if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        prevLogEntriesRef.current = displayedEntries;
        return;
    }

    const previousLatestEntry = prevLogEntriesRef.current.length > 0 ? prevLogEntriesRef.current[0] : null;

    if (!previousLatestEntry) {
        if (displayedEntries.length > 0 && ttsManager.isNarrating()) {
             const messagesToQueue = displayedEntries.slice().reverse().map(entry => entry.message);
             ttsManager.speakLogs(messagesToQueue);
        }
    } else {
        const lastSeenIndex = displayedEntries.findIndex(
            entry => entry.timestamp === previousLatestEntry.timestamp && entry.message === previousLatestEntry.message
        );
        
        if (lastSeenIndex !== 0) {
            const newEntries = lastSeenIndex === -1 ? displayedEntries : displayedEntries.slice(0, lastSeenIndex);
            
            if (newEntries.length > 0 && ttsManager.isNarrating()) {
                const messagesToQueue = newEntries.slice().reverse().map(entry => entry.message);
                ttsManager.speakLogs(messagesToQueue);
            }
        }
    }

    prevLogEntriesRef.current = displayedEntries;
  }, [displayedEntries]);

  return (
    <div className="my-4">
      <h3 className="text-xl font-western text-center text-[var(--ink-main)] mb-2">Town Crier</h3>
      <div 
        ref={logContainerRef}
        className="log-area max-h-[150px] overflow-y-auto border border-[var(--border-color)] p-3 rounded-lg bg-[#faf8f2] font-['Special_Elite'] text-sm leading-normal text-[#4a4a4a] shadow"
        aria-live="polite" 
        aria-atomic="false"
      >
        {displayedEntries.map((entry, index) => {
          const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const isRedText = entry.type === 'error' || entry.type === 'event';

          let textColorClass = '';
          const textStyle: React.CSSProperties = {};
          
          if (isRedText) {
              textColorClass = 'font-semibold';
              textStyle.color = 'var(--blood-red)';
          } else if (entry.type === 'action') {
              textColorClass = 'text-blue-600';
          } else if (entry.type === 'system') {
              textColorClass = 'font-semibold';
              textStyle.color = 'var(--heal-green-dark)';
          } else if (entry.type === 'turn') {
              textColorClass = 'text-purple-700 font-bold underline';
          } else if (entry.type === 'gold') {
              textColorClass = 'text-yellow-600 font-semibold';
          }

          return (
            <p key={`${entry.timestamp}-${index}`} className={textColorClass} style={textStyle}>
              {`[${time}] ${entry.message}`}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default GameLogComponent;