import React, { useState, useEffect, useRef } from 'react';
// FIX: Import PLAYER_ID from constants.ts instead of types.ts
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
  onDownload: (slotIndex: number) => void;
  onNewGame: (slotIndex: number) => void;
  onUploadAndLoad: (gameState: GameState, slotIndex: number) => void;
}

const SaveSlot: React.FC<{
  slotIndex: number;
  slotData: GameState | null;
  mode: 'save' | 'load' | 'download' | 'new';
  currentSaveSlot: number | null | undefined;
  onAction: (action: 'save' | 'load' | 'delete' | 'download' | 'new' | 'upload', index: number, file?: File) => void;
}> = ({ slotIndex, slotData, mode, currentSaveSlot, onAction }) => {
  const slotName = `Save Slot ${slotIndex + 1}`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAction('upload', slotIndex, file);
      // Reset file input to allow uploading the same file again
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  let content;
  let buttonArea: React.ReactNode = null;

  if (slotData) {
    const player = slotData.playerDetails[PLAYER_ID];
    content = (
      <div className="text-left text-sm">
        <p><span className="font-semibold">Character:</span> {player.character?.name || 'N/A'}</p>
        <p><span className="font-semibold">Name:</span> {player.name || 'N/A'}</p>
        <p><span className="font-semibold">Level:</span> NG+{slotData.ngPlusLevel}</p>
        <p><span className="font-semibold">Day:</span> {slotData.turn || 'N/A'}</p>
      </div>
    );
  } else {
    content = <p className="text-gray-500 italic">Empty Slot</p>;
  }

  if (mode === 'save') {
    const canSave = !slotData || currentSaveSlot === slotIndex;
    buttonArea = <button className="button w-full" disabled={!canSave} onClick={() => onAction('save', slotIndex)}>
      {currentSaveSlot === slotIndex || !slotData ? 'Save' : 'Overwrite'}
    </button>;
    if (!canSave) {
      buttonArea = <button className="button w-full" disabled>Cannot Overwrite</button>
    }
  } else if (mode === 'load') {
     if (slotData) {
        buttonArea = (
            <div className="flex flex-col gap-2 w-full">
                <button className="button" onClick={() => onAction('load', slotIndex)}>Load</button>
                <button className="button !bg-red-700 !text-white" onClick={() => onAction('delete', slotIndex)}>Delete</button>
            </div>
        );
     }
  } else if (mode === 'download') {
      buttonArea = (
        <div className="flex flex-col gap-2 w-full">
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} accept=".json" />
            <button className="button" onClick={handleUploadClick}>Upload</button>
            <button className="button" disabled={!slotData} onClick={() => onAction('download', slotIndex)}>Download</button>
        </div>
      );
  } else if (mode === 'new') {
    if (slotData) {
        buttonArea = <button className="button w-full !bg-red-700 !text-white" onClick={() => onAction('delete', slotIndex)}>Delete & Start New</button>;
    } else {
        buttonArea = <button className="button w-full" onClick={() => onAction('new', slotIndex)}>Start New Game</button>;
    }
  }
  
  // FIX: Replaced faulty logic using an undefined 'action' variable.
  // The slot should only be disabled if it's empty and in 'load' mode.
  // It should NOT be disabled in 'download' mode, even if empty, to allow for uploads.
  const isDisabled = mode === 'load' && !slotData;
  const isCurrentGame = currentSaveSlot === slotIndex;

  return (
    <div className={`flex flex-col items-center justify-between p-3 border-2 rounded-md transition-all 
      ${isDisabled ? 'bg-gray-200 border-gray-300 opacity-60' : 'bg-white border-[var(--border-color)]'}
      ${isCurrentGame ? '!border-[var(--tarnished-gold)] !shadow-lg' : ''}
    `}>
      <h4 className="font-bold font-western text-lg mb-2">{slotName}</h4>
      <div className="flex-grow flex items-center justify-center mb-2 min-h-[80px]">
        {content}
      </div>
      {buttonArea}
    </div>
  );
};


const SaveGameModalComponent: React.FC<SaveGameModalProps> = ({ isOpen, onClose, gameState, onSave, onLoad, onDelete, onDownload, onNewGame, onUploadAndLoad }) => {
  const [view, setView] = useState<'main' | 'save' | 'load' | 'download' | 'delete' | 'new'>('main');
  const [saves, setSaves] = useState<(GameState | null)[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<number | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [slotToOverwrite, setSlotToOverwrite] = useState<number | null>(null);
  const [uploadedGameState, setUploadedGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSaves(getSaveGames());
      setView('main'); // Reset to main view every time it opens
    }
  }, [isOpen]);

  const handleAction = (action: 'save' | 'load' | 'delete' | 'download' | 'new' | 'upload', index: number, file?: File) => {
    soundManager.playSound('ui_button_click');
    switch(action) {
      case 'new':
        onNewGame(index);
        break;
      case 'save':
        onSave(index);
        onClose();
        break;
      case 'load':
        onLoad(index);
        onClose();
        break;
      case 'delete':
        setSlotToDelete(index);
        setShowDeleteConfirm(true);
        break;
      case 'download':
        onDownload(index);
        break;
      case 'upload':
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const parsedState = JSON.parse(text);

                    // Basic validation
                    if (parsedState.status && parsedState.playerDetails && parsedState.turn !== undefined) {
                        if (saves[index]) { // Slot is not empty, confirm overwrite
                            setUploadedGameState(parsedState);
                            setSlotToOverwrite(index);
                            setShowOverwriteConfirm(true);
                        } else { // Slot is empty, just upload
                            onUploadAndLoad(parsedState, index);
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
        }
        break;
    }
  };
  
  const confirmDelete = () => {
    if (slotToDelete !== null) {
      const isNewGameFlow = view === 'new';
      onDelete(slotToDelete);
      setSaves(getSaveGames()); // Refresh saves after delete
      if (isNewGameFlow) {
        onNewGame(slotToDelete);
        onClose();
      }
    }
    setShowDeleteConfirm(false);
    setSlotToDelete(null);
  }

  const confirmOverwrite = () => {
    if (slotToOverwrite !== null && uploadedGameState) {
      onUploadAndLoad(uploadedGameState, slotToOverwrite);
      onClose();
    }
    setShowOverwriteConfirm(false);
    setSlotToOverwrite(null);
    setUploadedGameState(null);
  };

  const isSavePossible = () => {
    if (gameState.saveSlotIndex !== null && gameState.saveSlotIndex !== undefined) return true; // Can always save to its own slot
    return saves.some(s => s === null); // Can save if there is at least one empty slot
  };

  const renderContent = () => {
    if (showDeleteConfirm) {
        return (
             <ModalComponent
                isOpen={true}
                onClose={() => setShowDeleteConfirm(false)}
                title="Confirm Deletion"
                confirmText={view === 'new' ? "Delete & Start New" : "Delete"}
                confirmCallback={confirmDelete}
            >
                <p>Are you sure you want to permanently delete the save in Slot {slotToDelete !== null ? slotToDelete + 1 : ''}? This cannot be undone.</p>
            </ModalComponent>
        )
    }

    if (showOverwriteConfirm) {
      return (
           <ModalComponent
              isOpen={true}
              onClose={() => setShowOverwriteConfirm(false)}
              title="Confirm Overwrite"
              confirmText="Overwrite"
              confirmCallback={confirmOverwrite}
          >
              <p>Are you sure you want to overwrite the save in Slot {slotToOverwrite !== null ? slotToOverwrite + 1 : ''} with the uploaded file? This cannot be undone.</p>
          </ModalComponent>
      )
  }

    switch (view) {
      case 'new':
      case 'save':
      case 'load':
      case 'download':
      case 'delete':
        const isAllSlotsFullAndNewGame = saves.every(s => s !== null) && (gameState.saveSlotIndex === null || gameState.saveSlotIndex === undefined);
        return (
          <>
            <h3 className="font-western text-2xl text-center capitalize mb-4">{view === 'download' ? 'Download / Upload' : `${view} Game`}</h3>
             {view === 'save' && isAllSlotsFullAndNewGame && (
                <div className="text-center p-3 bg-red-100 border border-red-400 rounded-md mb-4">
                    <p className="text-red-800">All save slots are full. You must delete a save to continue.</p>
                    <button className="button mt-2" onClick={() => setView('delete')}>Delete a Save</button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {saves.map((slotData, i) => (
                <SaveSlot
                  key={i}
                  slotIndex={i}
                  slotData={slotData}
                  mode={view === 'delete' ? 'load' : view}
                  currentSaveSlot={gameState.saveSlotIndex}
                  onAction={handleAction}
                />
              ))}
            </div>
            <button className="button mt-6" onClick={() => setView('main')}>Back</button>
          </>
        );
      case 'main':
      default:
        return (
          <div className="flex flex-col items-center gap-4">
            <button className="button w-full" onClick={() => setView('new')}>
              New Game
            </button>
            <button className="button w-full" onClick={() => setView('save')} disabled={!isSavePossible()}>
              Save Game
              {!isSavePossible() && <span className="text-xs block">(All Slots Full)</span>}
            </button>
            <button className="button w-full" onClick={() => setView('load')}>Load Game</button>
            <button className="button w-full" onClick={() => setView('download')}>Download / Upload</button>
          </div>
        );
    }
  };

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Save Menu"
      singleActionText={view === 'main' ? "Close" : undefined}
    >
      {renderContent()}
    </ModalComponent>
  );
};

export default SaveGameModalComponent;
