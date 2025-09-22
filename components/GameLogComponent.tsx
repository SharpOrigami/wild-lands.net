
import React, { useEffect, useRef } from 'react';
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

  // De-duplicate entries first to ensure cleaner filtering logic
  const uniqueLogEntries: LogEntry[] = [];
  const seenLogKeys = new Set<string>();
  
  // The log arrives with newest entries first. We process it as is.
  for (const entry of logEntries) {
      const time = new Date(entry.timestamp);
      // Key based on message and time down to the second
      const key = `${entry.message}_${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
      if (!seenLogKeys.has(key)) {
          uniqueLogEntries.push(entry);
          seenLogKeys.add(key);
      }
  }

  // Now, filter the de-duplicated list for unwanted messages.
  const displayedEntries = uniqueLogEntries
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
          lowerMessage.includes("the hand's been dealt")
        ) {
          return false;
        }
      }
      return true;
    })
    .filter((entry, index, self) => {
      // De-duplicate "Generating intro story" messages, keeping the first.
      if (entry.message.includes('Generating intro story for')) {
          return self.findIndex(e => e.message.includes('Generating intro story for')) === index;
      }
      return true;
    })
    .slice(0, MAX_LOG_ENTRIES);

  useEffect(() => {
    // Scroll to the top to show the newest message, only when the latest visible entry changes.
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [displayedEntries[0]?.timestamp, displayedEntries[0]?.message]);

  useEffect(() => {
    const handleNarrationChange = () => {
        const isNowNarrating = ttsManager.isNarrating();
        if (isNowNarrating && !isNarrationOnRef.current) { // Just turned on
            if (displayedEntries.length > 0) {
                // Speak only the very latest message when narration is turned on.
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
        // This handles the very first batch of log entries after the game starts.
        if (displayedEntries.length > 0 && ttsManager.isNarrating()) {
             // Queue messages in chronological order (oldest first)
             const messagesToQueue = displayedEntries.slice().reverse().map(entry => entry.message);
             ttsManager.speakLogs(messagesToQueue);
        }
    } else {
        // Find where the old list starts in the new list.
        const lastSeenIndex = displayedEntries.findIndex(
            entry => entry.timestamp === previousLatestEntry.timestamp && entry.message === previousLatestEntry.message
        );
        
        // If the last seen entry isn't at the top (index 0), it means there are new entries.
        if (lastSeenIndex !== 0) {
            // Slice the new entries. If lastSeenIndex is -1 (not found), all displayed entries are new.
            const newEntries = lastSeenIndex === -1 ? displayedEntries : displayedEntries.slice(0, lastSeenIndex);
            
            if (newEntries.length > 0 && ttsManager.isNarrating()) {
                // Reverse the new entries to get chronological order, then interrupt and queue each message.
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
        className="log-area max-h-[150px] overflow-y-auto border border-[var(--border-color)] p-3 rounded-sm bg-[#faf8f2] font-['Special_Elite'] text-sm leading-normal text-[#4a4a4a] shadow"
        aria-live="polite" 
        aria-atomic="false"
      >
        {displayedEntries.map((entry, index) => {
          const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          let textColor = '';
          if (entry.type === 'error') textColor = 'text-red-600 font-semibold';
          else if (entry.type === 'action') textColor = 'text-blue-600';
          else if (entry.type === 'system') textColor = 'text-green-700 font-semibold';
          else if (entry.type === 'turn') textColor = 'text-purple-700 font-bold underline';
          else if (entry.type === 'event') textColor = 'text-red-700 font-semibold';
          else if (entry.type === 'gold') textColor = 'text-yellow-600 font-semibold';
          // 'debug' type is already filtered out for display

          return (
            <p key={`${entry.timestamp}-${index}`} className={textColor}>
              {`[${time}] ${entry.message}`}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default GameLogComponent;