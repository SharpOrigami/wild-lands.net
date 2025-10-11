import React, { useEffect, useState, useRef } from 'react';
import { soundManager } from '../utils/soundManager.ts';
import { ttsManager } from '../utils/ttsManager.ts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmCallback?: () => void;
  confirmText?: string;
  singleActionText?: string;
  choices?: { text: string; callback: () => void }[];
  isStoryModal?: boolean;
  textToNarrate?: string;
}

const ModalComponent: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  confirmCallback, 
  confirmText = "Confirm",
  singleActionText = "Alright",
  choices,
  isStoryModal = false,
  textToNarrate
}) => {
  const [isNarrating, setIsNarrating] = useState(ttsManager.isNarrating());
  const prevIsOpen = useRef(isOpen);

  useEffect(() => {
    const handleNarrationChange = () => {
      setIsNarrating(ttsManager.isNarrating());
    };
    ttsManager.addListener(handleNarrationChange);
    return () => ttsManager.removeListener(handleNarrationChange);
  }, []);

  useEffect(() => {
    let speakTimer: number | undefined;

    const speak = () => {
        if (textToNarrate) {
            ttsManager.speak(textToNarrate, () => {
              // This callback in speak() is for when the narration itself finishes.
              // The modal closing logic is handled by the user clicking the button.
            });
        }
    };

    if (isOpen && isStoryModal && textToNarrate) {
        if (isNarrating) {
            // If the modal was just opened, delay the speech to allow for animations.
            // If narration is turned on while the modal is already open, speak with a shorter delay.
            const wasJustOpened = !prevIsOpen.current && isOpen;
            const delay = wasJustOpened ? 50 : 50;
            speakTimer = window.setTimeout(speak, delay);
        } else {
            // If narration is toggled off, cancel any speech.
            ttsManager.cancel();
        }
    }

    // Update the ref for the next render cycle.
    prevIsOpen.current = isOpen;

    // This cleanup function runs whenever dependencies change or the component unmounts.
    // It's crucial for stopping narration if the modal is closed early or if narration is toggled off.
    return () => {
        if (speakTimer) clearTimeout(speakTimer);
        
        // If the modal closes for any reason, cancel any ongoing speech.
        if (isStoryModal) {
            ttsManager.cancel();
        }
    };
  }, [isOpen, isStoryModal, textToNarrate, isNarrating]);


  if (!isOpen) return null;

  const handleConfirm = () => {
    soundManager.playSound('ui_button_click');
    if (confirmCallback) {
      confirmCallback();
    }
    onClose(); // Close modal after confirm action by default
  };
  
  const handleClose = () => {
    soundManager.playSound('ui_button_click');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();

        // Do not trigger action if there are multiple choices, as the intent is ambiguous.
        if (choices && choices.length > 0) {
          return;
        }

        if (confirmCallback) {
          handleConfirm();
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, choices, confirmCallback, onClose]);
  
  const handleChoice = (callback: () => void) => {
    soundManager.playSound('ui_button_click');
    callback();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.75)] z-[1010]" onClick={handleClose}>
      <div 
        className="bg-[var(--paper-bg)] p-8 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.2)] w-[90vw] max-w-2xl text-left border-2 border-[var(--ink-main)] text-[var(--ink-main)] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h3 className="font-['Rye'] text-3xl text-[var(--ink-main)] text-center">{title}</h3>
        <div className="max-h-[60vh] overflow-y-auto modal-body pr-2">
            {children}
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-2">
            {choices && choices.length > 0 ? (
                choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => handleChoice(choice.callback)}
                        className="button modal-choice-button"
                    >
                        {choice.text}
                    </button>
                ))
            ) : confirmCallback ? (
                 <button 
                    onClick={handleConfirm}
                    className="button modal-action-button"
                 >
                    {confirmText}
                 </button>
            ) : (
                 <button 
                    onClick={handleClose}
                    className="button modal-close-button"
                 >
                    {singleActionText}
                 </button>
            )}
            {confirmCallback && (!choices || choices.length === 0) && ( // Show Cancel only if it's a confirm dialog, not a choice dialog
                <button 
                    onClick={handleClose}
                    className={`button modal-close-button bg-[var(--ink-secondary)] text-[var(--paper-bg)] hover:bg-[var(--ink-main)] hover:text-[var(--paper-bg)]`}
                >
                    Cancel
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ModalComponent;