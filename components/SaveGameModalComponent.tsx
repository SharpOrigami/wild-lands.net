import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types.ts';
import { PLAYER_ID } from '../constants.ts';
import { getSaveGames } from '../utils/saveUtils.ts';
import ModalComponent from './ModalComponent.tsx';
import { soundManager } from '../utils/soundManager.ts';

interface SaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onSave: (slotIndex: number) => void;
  onLoad: (slotIndex: number) => void;
  onDelete: (slotIndex: number) => void;
  onExport: (slotIndex: number) => void;
  onNewGame: (slotIndex: number) => void;
  onImportAndLoad: (gameState: GameState, slotIndex: number) => void;
}

const SaveGameModalComponent: React.FC<SaveGameModalProps> = ({ isOpen, onClose, gameState, onSave, onLoad, onDelete, onExport, onNewGame, onImportAndLoad }) => {
  const [saves, setSaves] = useState<(GameState | null)[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'overwrite' | 'new_on_full'; slotIndex: number; file?: File; } | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSaves(getSaveGames());
    }
  }, [isOpen]);

  const handleAction = (action: 'save' | 'load' | 'delete' | 'export' | 'new' | 'import', index: number, file?: File) => {
    soundManager.playSound('ui_button_click');
    const targetSlot = saves[index];

    switch (action) {
      case 'new':
        if (targetSlot) {
          setConfirmAction({ type: 'new_on_full', slotIndex: index });
        } else {
          onNewGame(index);
          onClose();
        }
        break;
      case 'save':
        if (targetSlot && targetSlot.runId !== gameState.runId) {
          setConfirmAction({ type: 'overwrite', slotIndex: index });
        } else {
          onSave(index);
          onClose();
        }
        break;
      case 'load':
        if (targetSlot) {
          onLoad(index);
          onClose();
        }
        break;
      case 'delete':
        setConfirmAction({ type: 'delete', slotIndex: index });
        break;
      case 'export':
        onExport(index);
        break;
      case 'import':
        fileInputRefs.current[index]?.click();
        break;
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedState = JSON.parse(text);
          if (parsedState.status && parsedState.playerDetails && parsedState.turn !== undefined) {
            if (saves[index]) {
              setConfirmAction({ type: 'overwrite', slotIndex: index, file });
            } else {
              onImportAndLoad(parsedState, index);
              onClose();
            }
          } else {
            alert('Invalid save file format.');
          }
        } catch (error) {
          alert('Failed to read or parse save file.');
          console.error(error);
        }
      };
      reader.readAsText(file);
      if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
    }
  };

  const executeConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'delete' || confirmAction.type === 'new_on_full') {
      onDelete(confirmAction.slotIndex);
      if (confirmAction.type === 'new_on_full') {
        onNewGame(confirmAction.slotIndex);
        onClose();
      } else {
        setSaves(getSaveGames());
      }
    } else if (confirmAction.type === 'overwrite' && confirmAction.file) { // Import overwrite
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsedState = JSON.parse(text);
            onImportAndLoad(parsedState, confirmAction.slotIndex);
            onClose();
        };
        reader.readAsText(confirmAction.file);
    } else if (confirmAction.type === 'overwrite') { // Save overwrite
        onSave(confirmAction.slotIndex);
        onClose();
    }
    
    setConfirmAction(null);
  };

  const getConfirmationContent = () => {
    if (!confirmAction) return null;
    switch (confirmAction.type) {
      case 'delete':
        return { title: 'Confirm Deletion', text: `Are you sure you want to permanently delete the save in ${confirmAction.slotIndex === 3 ? 'the Autosave Slot' : `Slot ${confirmAction.slotIndex + 1}`}?`, confirmText: 'Delete' };
      case 'new_on_full':
        return { title: 'Confirm Overwrite', text: `This slot contains a saved game. Are you sure you want to delete it and start a new game here?`, confirmText: 'Delete & Start New' };
      case 'overwrite':
        return { title: 'Confirm Overwrite', text: `Are you sure you want to overwrite the save in Slot ${confirmAction.slotIndex + 1}?`, confirmText: 'Overwrite' };
      default:
        return null;
    }
  };

  const confirmationContent = getConfirmationContent();

  const isSaveableState = gameState.status === 'playing' || gameState.status === 'playing_initial_reveal' || gameState.status === 'setup';

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Game Saves"
      singleActionText="Close"
    >
      {confirmationContent ? (
        <ModalComponent
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          title={confirmationContent.title}
          confirmText={confirmationContent.confirmText}
          confirmCallback={executeConfirm}
        >
          <p>{confirmationContent.text}</p>
        </ModalComponent>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => {
            const slotData = saves[i];
            const isCurrentGame = slotData?.runId && slotData.runId === gameState.runId;
            const isAutosaveSlot = i === 3;

            return (
              <div key={i} className={`relative flex flex-col p-3 border-2 rounded-lg transition-all
                ${isCurrentGame ? 'border-4 border-[var(--tarnished-gold)] shadow-lg bg-yellow-50' : isAutosaveSlot ? 'bg-blue-50 border-blue-200' : 'bg-white border-[var(--border-color)]'}
              `}>
                <h4 className="font-bold font-western text-lg mb-2 text-center">
                    {isAutosaveSlot ? 'Autosave Slot' : `Save Slot ${i + 1}`}
                </h4>
                <div className="flex-grow flex items-center justify-center mb-3 min-h-[90px] text-left text-sm p-2 bg-stone-100 rounded border border-dashed border-stone-300">
                  {slotData ? (
                    <div>
                      <p><span className="font-semibold">Character:</span> {slotData.playerDetails[PLAYER_ID]?.character?.name || 'N/A'}</p>
                      <p><span className="font-semibold">Name:</span> {slotData.playerDetails[PLAYER_ID]?.name || 'N/A'}</p>
                      <p><span className="font-semibold">Level:</span> NG+{slotData.ngPlusLevel}</p>
                      <p><span className="font-semibold">Day:</span> {slotData.turn || 'N/A'}</p>
                    </div>
                  ) : <p className="text-gray-500 italic text-center">Empty Slot</p>}
                </div>

                <div className="flex flex-col gap-2 w-full mt-auto">
                  {slotData ? (
                    <>
                      {isSaveableState && !isAutosaveSlot && <button className="button text-sm" onClick={() => handleAction('save', i)}>Overwrite</button>}
                      <button className="button text-sm" onClick={() => handleAction('load', i)} disabled={isCurrentGame}>Load</button>
                      <button className="button button-danger text-sm" onClick={() => handleAction('delete', i)}>Delete</button>
                      <button className="button text-sm" onClick={() => handleAction('export', i)}>Export</button>
                    </>
                  ) : (
                    <>
                      {!isAutosaveSlot && <button className="button text-sm" onClick={() => handleAction('new', i)}>New Game</button>}
                      {isSaveableState && !isAutosaveSlot && <button className="button text-sm" onClick={() => handleAction('save', i)}>Save Here</button>}
                      <input type="file" ref={el => { if(el) fileInputRefs.current[i] = el; }} onChange={(e) => handleFileSelected(e, i)} style={{ display: 'none' }} accept=".json" />
                      {!isAutosaveSlot && <button className="button text-sm" onClick={() => handleAction('import', i)}>Import</button>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalComponent>
  );
};

export default SaveGameModalComponent;
