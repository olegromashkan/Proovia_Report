import Modal from './Modal';
import Icon from './Icon';
import { RouteGroup, TimeSettings } from '../types/schedule';
import { ChangeEvent } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    routeGroups: RouteGroup[];
    setRouteGroups: React.Dispatch<React.SetStateAction<RouteGroup[]>>;
    updateGroup: (idx: number, group: RouteGroup) => void;
    ignoredPatterns: string[];
    setIgnoredPatterns: (patterns: string[]) => void;
    timeSettings: TimeSettings;
    setTimeSettings: React.Dispatch<React.SetStateAction<TimeSettings>>;
    resetSettings: () => void;
}

export default function ScheduleSettingsModal({
    open,
    onClose,
    routeGroups,
    setRouteGroups,
    updateGroup,
    ignoredPatterns,
    setIgnoredPatterns,
    timeSettings,
    setTimeSettings,
    resetSettings,
}: Props) {
    const handlePatternChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setIgnoredPatterns(e.target.value.split('\n').map(p => p.trim()).filter(Boolean));
    };

    return (
        <Modal open={open} onClose={onClose} className="max-w-4xl">
            <h3 className="font-bold text-xl mb-4">Settings</h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <section className="card bg-base-100 shadow p-4">
                    <h4 className="card-title text-lg mb-2">Time Logic</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-sm">
                            Late End Hour
                            <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={timeSettings.lateEndHour}
                                onChange={(e) => setTimeSettings({ ...timeSettings, lateEndHour: parseInt(e.target.value) || 20 })}
                                min={0}
                                max={24}
                            />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            Early Start Hour
                            <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={timeSettings.earlyStartHour}
                                onChange={(e) => setTimeSettings({ ...timeSettings, earlyStartHour: parseInt(e.target.value) || 7 })}
                                min={0}
                                max={24}
                            />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            Early End Hour
                            <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={timeSettings.earlyEndHour}
                                onChange={(e) => setTimeSettings({ ...timeSettings, earlyEndHour: parseInt(e.target.value) || 17 })}
                                min={0}
                                max={24}
                            />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            Late Start Hour
                            <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={timeSettings.lateStartHour}
                                onChange={(e) => setTimeSettings({ ...timeSettings, lateStartHour: parseInt(e.target.value) || 9 })}
                                min={0}
                                max={24}
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="toggle toggle-sm"
                                checked={timeSettings.enableRestWarning}
                                onChange={(e) => setTimeSettings({ ...timeSettings, enableRestWarning: e.target.checked })}
                            />
                            Show Rest Warnings
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="toggle toggle-sm"
                                checked={timeSettings.enableEarlyWarning}
                                onChange={(e) => setTimeSettings({ ...timeSettings, enableEarlyWarning: e.target.checked })}
                            />
                            Show Early Warnings
                        </label>
                    </div>
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full mt-2"
                        value={timeSettings.restMessage}
                        onChange={(e) => setTimeSettings({ ...timeSettings, restMessage: e.target.value })}
                        placeholder="Rest warning message"
                    />
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full mt-2"
                        value={timeSettings.earlyMessage}
                        onChange={(e) => setTimeSettings({ ...timeSettings, earlyMessage: e.target.value })}
                        placeholder="Early warning message"
                    />
                </section>
                <section className="card bg-base-100 shadow p-4">
                    <h4 className="card-title text-lg mb-2">Route Groups</h4>
                    {routeGroups.map((group, idx) => (
                        <div key={idx} className="border p-2 rounded-md mb-2 space-y-1">
                            <div className="flex items-center gap-2">
                                <input
                                    className="input input-bordered input-xs flex-1"
                                    value={group.name}
                                    onChange={(e) => updateGroup(idx, { ...group, name: e.target.value })}
                                    placeholder="Group name"
                                />
                                <input
                                    className="input input-bordered input-xs w-32"
                                    value={group.color}
                                    onChange={(e) => updateGroup(idx, { ...group, color: e.target.value })}
                                    placeholder="text-color-500"
                                />
                                <label className="flex items-center gap-1 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={group.isFull}
                                        onChange={(e) => updateGroup(idx, { ...group, isFull: e.target.checked })}
                                    />
                                    Full
                                </label>
                                <button
                                    className="btn btn-xs btn-error"
                                    onClick={() => setRouteGroups(arr => arr.filter((_, i) => i !== idx))}
                                >
                                    Remove
                                </button>
                            </div>
                            <textarea
                                className="textarea textarea-bordered w-full text-xs h-16"
                                value={group.codes.join(', ')}
                                onChange={(e) => updateGroup(idx, { ...group, codes: e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean) })}
                                placeholder="Codes, separated by comma"
                            />
                        </div>
                    ))}
                    <button
                        className="btn btn-sm mt-2"
                        onClick={() => setRouteGroups([...routeGroups, { name: 'New Group', codes: [], isFull: false, color: 'text-white' }])}
                    >
                        <Icon name="plus" className="w-4 h-4 mr-1" />
                        Add Group
                    </button>
                </section>
                <section className="card bg-base-100 shadow p-4">
                    <h4 className="card-title text-lg mb-2">Ignored Calendar Patterns</h4>
                    <textarea
                        className="textarea textarea-bordered w-full text-xs h-24"
                        value={ignoredPatterns.join('\n')}
                        onChange={handlePatternChange}
                        placeholder="One pattern per line"
                    />
                </section>
            </div>
            <div className="modal-action">
                <button className="btn btn-outline mr-auto" onClick={resetSettings}>Reset Defaults</button>
                <button className="btn" onClick={onClose}>Close</button>
            </div>
        </Modal>
    );
}
