import { useState } from 'react';
import { useAppStore } from '../store';
import { generateRoster, type GenerationResult } from '../utils/generator';
import { Play, AlertTriangle, CheckCircle, Download, Copy, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { clsx } from 'clsx';
import type { DayShift, Violation } from '../types';

export function ResultPage() {
    const { staffList, holidays, currentMonth } = useAppStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<GenerationResult[]>([]);
    const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleGenerate = async () => {
        if (staffList.length === 0) {
            alert('職員が登録されていません');
            return;
        }
        setIsGenerating(true);
        setResults([]);
        try {
            const generated = await generateRoster(currentMonth, staffList, holidays);
            setResults(generated);
            setSelectedPatternIndex(0);
        } catch (e) {
            console.error(e);
            alert('生成エラーが発生しました');
        } finally {
            setIsGenerating(false);
        }
    };

    const currentResult = results[selectedPatternIndex];

    const getStaffName = (id: string | null) => {
        if (!id) return '未割当';
        return staffList.find(s => s.id === id)?.name || '不明';
    };

    const formatDataForExport = (shifts: DayShift[], violations: Violation[]) => {
        return shifts.map(shift => {
            const date = parseISO(shift.date);
            const weekDay = format(date, 'E', { locale: ja });
            const staffName = getStaffName(shift.staffId);
            const violation = violations.find(v => v.date === shift.date);
            const note = violation ? violation.message : '';
            const typeLabel = shift.isHoliday ? '祝日' : (format(date, 'E') === 'Sat' || format(date, 'E') === 'Sun') ? '休日' : '平日';

            return {
                date: format(date, 'yyyy/MM/dd'),
                weekDay,
                type: typeLabel,
                staffName,
                note
            };
        });
    };

    const handleExportCSV = () => {
        if (!currentResult) return;

        const data = formatDataForExport(currentResult.shifts, currentResult.violations);
        const header = ['日付', '曜日', '区分', '担当者', 'メモ'];
        const rows = data.map(d => [d.date, d.weekDay, d.type, d.staffName, d.note]);

        const csvContent = [
            header.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Add BOM for Excel compatibility
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `当直表_${currentMonth}_pattern${selectedPatternIndex + 1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyToClipboard = async () => {
        if (!currentResult) return;

        const data = formatDataForExport(currentResult.shifts, currentResult.violations);
        // Format as simple text table: Date (Day) Staff Note
        const textContent = data.map(d => {
            // Use tab for Excel pasting
            return `${d.date}(${d.weekDay})\t${d.staffName}\t${d.note}`;
        }).join('\n');

        try {
            await navigator.clipboard.writeText(textContent);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            alert('コピーに失敗しました');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">シフト作成</h2>
                    <p className="text-gray-500 text-sm">条件に基づいて複数のシフトパターンを生成します。</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition-all",
                        isGenerating ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200"
                    )}
                >
                    {isGenerating ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            生成中...
                        </span>
                    ) : (
                        <>
                            <Play size={20} fill="currentColor" />
                            シフトを作成する
                        </>
                    )}
                </button>
            </div>

            {results.length > 0 && currentResult && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        {/* Pattern Selection Tabs */}
                        <div className="flex overflow-x-auto pb-2 gap-2">
                            {results.map((res: GenerationResult, idx: number) => (
                                <button
                                    key={res.patternId}
                                    onClick={() => setSelectedPatternIndex(idx)}
                                    className={clsx(
                                        "flex flex-col items-start px-4 py-2 rounded-lg border min-w-[140px] transition-all",
                                        selectedPatternIndex === idx
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wider">Pattern {idx + 1}</span>
                                    <span className="text-sm mt-1">スコア: {res.score}</span>
                                </button>
                            ))}
                        </div>

                        {/* Export Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyToClipboard}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                            >
                                {copySuccess ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                {copySuccess ? 'コピーしました' : 'コピー'}
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                            >
                                <Download size={16} />
                                CSV保存
                            </button>
                        </div>
                    </div>

                    {/* Alert / Summary Section */}
                    <div className={clsx(
                        "p-4 rounded-lg border flex items-start gap-3",
                        currentResult.violations.length > 0 ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-green-50 border-green-200 text-green-900"
                    )}>
                        {currentResult.violations.length > 0 ? <AlertTriangle className="shrink-0 mt-0.5" /> : <CheckCircle className="shrink-0 mt-0.5" />}
                        <div>
                            <h4 className="font-bold text-sm mb-1">
                                {currentResult.violations.length > 0 ? 'いくつかの制約を満たせませんでした' : 'すべての制約を満たしています'}
                            </h4>
                            <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
                                {currentResult.violations.map((v: Violation, i: number) => (
                                    <li key={i}>
                                        {format(parseISO(v.date), 'M/d')}: {v.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Roster Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">日付</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">区分</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">担当者</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">メモ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentResult.shifts.map((shift: DayShift) => {
                                        const date = parseISO(shift.date);
                                        const weekDay = format(date, 'E', { locale: ja });
                                        const isSat = weekDay === '土';
                                        const isSun = weekDay === '日';
                                        const isHol = shift.isHoliday;

                                        // Check for violations on this day
                                        const violation = currentResult.violations.find((v: Violation) => v.date === shift.date);

                                        return (
                                            <tr key={shift.date} className={clsx("hover:bg-gray-50", violation && "bg-amber-50/50")}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={clsx(
                                                        "font-mono",
                                                        (isSun || isHol) ? "text-red-500" : isSat ? "text-blue-600" : "text-gray-900"
                                                    )}>
                                                        {format(date, 'MM/dd')} ({weekDay})
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {isHol ? <span className="text-red-500 text-xs border border-red-200 bg-red-50 px-2 py-0.5 rounded">祝日</span> :
                                                        isSat || isSun ? <span className="text-gray-500 text-xs">休日</span> : <span className="text-gray-400 text-xs">平日</span>}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {getStaffName(shift.staffId)}
                                                </td>
                                                <td className="px-4 py-3 text-red-500 text-xs">
                                                    {violation?.message}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {results.length === 0 && !isGenerating && (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400">「シフトを作成する」ボタンを押して開始してください</p>
                </div>
            )}
        </div>
    );
}
