import Icon from './Icon';
import { Trip } from '../types/schedule';

interface Props {
    selected: number[];
    items: Trip[];
    isLeft: boolean;
    getTasks: (text?: string) => string;
    getDuration: (it: Trip, isLeft: boolean) => number;
    formatDuration: (minutes: number) => string;
}

export default function ScheduleSelectedStats({ selected, items, isLeft, getTasks, getDuration, formatDuration }: Props) {
    if (selected.length <= 1) return null;
    const selectedItems = items.filter((_, i) => selected.includes(i));
    let totalTasks = 0, countTasks = 0, totalAmount = 0, countAmount = 0, totalPunct = 0, countPunct = 0, totalDuration = 0, countDuration = 0;
    const uniqueDrivers = new Set(selectedItems.map(it => it.Driver1).filter(Boolean)).size;
    selectedItems.forEach(it => {
        const tasks = parseFloat(getTasks(it.Calendar_Name) || '0');
        if (!isNaN(tasks)) {
            totalTasks += tasks;
            countTasks++;
        }
        const amount = parseFloat(it.Order_Value || '0');
        if (!isNaN(amount)) {
            totalAmount += amount;
            countAmount++;
        }
        const punct = parseFloat(it.Punctuality || '0');
        if (!isNaN(punct)) {
            totalPunct += punct;
            countPunct++;
        }
        const dur = getDuration(it, isLeft);
        if (!isNaN(dur)) {
            totalDuration += dur;
            countDuration++;
        }
    });
    const avgTasks = countTasks > 0 ? totalTasks / countTasks : 0;
    const avgAmount = countAmount > 0 ? totalAmount / countAmount : 0;
    const avgPunct = countPunct > 0 ? totalPunct / countPunct : 0;
    const avgDuration = countDuration > 0 ? totalDuration / countDuration : 0;
    const avgDurationFormatted = formatDuration(avgDuration);
    return (
        <div className="text-xs flex flex-wrap gap-1.5 items-center bg-gray-800 dark:bg-gray-900/80 p-1.5 rounded-lg shadow-md sticky bottom-0 z-10 border-t border-gray-700 dark:border-gray-600">
            <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                <Icon name="list-ul" className="w-3 h-3" />
                {selected.length} ({uniqueDrivers})
            </span>
            <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                <Icon name="check-square" className="w-3 h-3" />
                {totalTasks.toFixed(2)} / {avgTasks.toFixed(2)}
            </span>
            <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                <Icon name="currency-dollar" className="w-3 h-3" />
                {totalAmount.toFixed(2)} / {avgAmount.toFixed(2)}
            </span>
            <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                <Icon name="clock" className="w-3 h-3" />
                {avgPunct.toFixed(2)}
            </span>
            <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                <Icon name="hourglass" className="w-3 h-3" />
                {avgDurationFormatted}
            </span>
        </div>
    );
}
