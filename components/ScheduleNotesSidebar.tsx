import { DragEvent, ChangeEvent, Dispatch, SetStateAction } from 'react';
import Icon from './Icon';

interface Panel {
    name: string;
    color: string;
    icon: string;
}

interface Props {
    panels: Panel[];
    notes: Record<string, string>;
    handleNoteChange: (panel: string, value: string) => void;
    clearNote: (panel: string) => void;
    handleInputFile: (e: ChangeEvent<HTMLInputElement>) => void;
    handleDropFile: (e: DragEvent<HTMLDivElement>) => void;
    clearAllLeft: () => void;
    clearAllRight: () => void;
    lockCopy: boolean;
    setLockCopy: (v: boolean) => void;
    disableRowSelection: boolean;
    setDisableRowSelection: (v: boolean) => void;
    setSelectedLeft: Dispatch<SetStateAction<number[]>>;
    setSelectedRight: Dispatch<SetStateAction<number[]>>;
    setSettingsOpen: (v: boolean) => void;
}

export default function ScheduleNotesSidebar({
    panels,
    notes,
    handleNoteChange,
    clearNote,
    handleInputFile,
    handleDropFile,
    clearAllLeft,
    clearAllRight,
    lockCopy,
    setLockCopy,
    disableRowSelection,
    setDisableRowSelection,
    setSelectedLeft,
    setSelectedRight,
    setSettingsOpen,
}: Props) {
    return (
        <div className="w-64 flex flex-col gap-1 h-full overflow-y-auto p-1 bg-base-200 dark:bg-base-100 rounded-md shadow-inner lg:w-64 md:w-48 sm:w-full sm:overflow-x-auto">
            <div className="flex flex-col gap-1 mb-1">
                <div
                    className="border border-dashed rounded p-1 text-center cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200"
                    onDrop={handleDropFile}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.currentTarget.classList.add('bg-gray-900', 'dark:bg-gray-900/30')}
                    onDragLeave={(e) => e.currentTarget.classList.remove('bg-gray-900', 'dark:bg-gray-900/30')}
                >
                    <input id="fileAll" type="file" accept=".json" onChange={handleInputFile} className="hidden" />
                    <label htmlFor="fileAll" className="flex items-center justify-center gap-1 text-xs cursor-pointer">
                        <Icon name="file-arrow-up" className="text-base" />
                        Upload JSON
                    </label>
                </div>
                <div className="flex flex-row gap-1 justify-center">
                    <button
                        onClick={() => {
                            clearAllLeft();
                            clearAllRight();
                        }}
                        className="btn btn-error btn-outline btn-xs flex items-center justify-center"
                        title="Clear all data"
                    >
                        <Icon name="trash" className="w-3 h-3" />
                    </button>
                    <button
                        className="btn btn-xs flex items-center justify-center"
                        onClick={() => setLockCopy(!lockCopy)}
                        title={lockCopy ? 'Unlock copy' : 'Lock copy'}
                    >
                        <Icon name={lockCopy ? 'lock' : 'unlock'} className="w-3 h-3" />
                    </button>
                    <button
                        className="btn btn-xs flex items-center justify-center"
                        onClick={() => {
                            const newValue = !disableRowSelection;
                            setDisableRowSelection(newValue);
                            if (newValue) {
                                setSelectedLeft([]);
                                setSelectedRight([]);
                            }
                        }}
                        title={disableRowSelection ? 'Unlock row selection' : 'Lock row selection'}
                    >
                        <Icon name={disableRowSelection ? 'lock' : 'unlock'} className="w-3 h-3" />
                    </button>
                    <button
                        className="btn btn-xs flex items-center justify-center"
                        onClick={() => setSettingsOpen(true)}
                        title="Open settings"
                    >
                        <Icon name="gear" className="w-3 h-3" />
                    </button>
                </div>
            </div>
            <div className="text-sm font-semibold text-base-content mb-1">Notes</div>
            <div className="flex flex-col gap-1">
                {panels.map(panel => (
                    <div key={panel.name} className={`card ${panel.color} shadow rounded-md overflow-hidden`}>
                        <div className="p-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-xs font-medium flex items-center gap-1">
                                    <Icon name={panel.icon} className="w-3 h-3" />
                                    {panel.name}
                                </h3>
                                <button
                                    onClick={() => clearNote(panel.name)}
                                    className="btn btn-ghost btn-xs p-0 min-h-0 h-3 w-3 opacity-60 hover:opacity-100"
                                    title="Clear note"
                                >
                                    ✕
                                </button>
                            </div>
                            <textarea
                                className="textarea w-full text-xs bg-white dark:bg-base-100 border border-gray-300 dark:border-gray-600 p-1 rounded resize-none h-24 overflow-y-auto focus:outline-none focus:border-blue-500"
                                placeholder={`Notes for ${panel.name}...`}
                                value={notes[panel.name] || ''}
                                onChange={(e) => handleNoteChange(panel.name, e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
