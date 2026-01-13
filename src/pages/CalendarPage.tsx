import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSaturday, isSunday, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Star, Calendar as CalendarIcon, Ban } from 'lucide-react';
import { useAppStore } from '../store';
import { clsx } from 'clsx';

type Mode = 'holiday' | 'staff_constraint';

export function CalendarPage() {
    const { currentMonth, setMonth, holidays, addHoliday, removeHoliday, staffList, updateStaff } = useAppStore();
    const [mode, setMode] = useState<Mode>('holiday');
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    const currentDate = useMemo(() => parseISO(currentMonth + '-01'), [currentMonth]);

    const days = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const selectedStaff = useMemo(() =>
        staffList.find(s => s.id === selectedStaffId),
        [staffList, selectedStaffId]
    );

    const toggleHoliday = (dateStr: string) => {
        if (holidays.includes(dateStr)) {
            removeHoliday(dateStr);
        } else {
            addHoliday(dateStr);
        }
    };

    const toggleStaffConstraint = (dateStr: string) => {
        if (!selectedStaff || !selectedStaffId) return;

        // Cycle: Neutral -> Unavailable -> Preference -> Neutral
        const isUnavailable = selectedStaff.unavailability.includes(dateStr);
        const isPreference = selectedStaff.preferences.includes(dateStr);

        if (isUnavailable) {
            // Switch from Unavailable to Preference
            updateStaff(selectedStaffId, {
                unavailability: selectedStaff.unavailability.filter(d => d !== dateStr),
                preferences: [...selectedStaff.preferences, dateStr],
            });
        } else if (isPreference) {
            // Switch from Preference to Neutral
            updateStaff(selectedStaffId, {
                preferences: selectedStaff.preferences.filter(d => d !== dateStr),
            });
        } else {
            // Switch from Neutral to Unavailable
            updateStaff(selectedStaffId, {
                unavailability: [...selectedStaff.unavailability, dateStr],
            });
        }
    };

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (mode === 'holiday') {
            toggleHoliday(dateStr);
        } else {
            toggleStaffConstraint(dateStr);
        }
    };

    const changeMonth = (delta: number) => {
        const newDate = delta > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        setMonth(format(newDate, 'yyyy-MM'));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">カレンダー設定</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        祝日の設定や、職員ごとの希望・不可日を登録します。
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('holiday')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            mode === 'holiday' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        祝日設定
                    </button>
                    <button
                        onClick={() => setMode('staff_constraint')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            mode === 'staff_constraint' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        職員の希望/不可
                    </button>
                </div>
            </div>

            {mode === 'staff_constraint' && (
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">設定する職員を選択</label>
                    <select
                        value={selectedStaffId || ''}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">選択してください</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                    </select>
                    {!selectedStaffId && (
                        <p className="text-sm text-amber-600 mt-2">
                            ※職員を選択してから日付をクリックしてください
                        </p>
                    )}
                    {selectedStaffId && (
                        <div className="text-sm text-gray-500 mt-2 flex gap-4">
                            <span className="flex items-center gap-1"><Ban size={14} className="text-red-500" /> 不可</span>
                            <span className="flex items-center gap-1"><Star size={14} className="text-blue-500" /> 希望</span>
                            <span className="text-xs text-gray-400">クリックで切り替え</span>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <h3 className="text-xl font-bold text-gray-800">
                        {format(currentDate, 'yyyy年 M月', { locale: ja })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronRight size={24} className="text-gray-600" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                        <div key={day} className={clsx("bg-gray-50 p-3 text-center text-sm font-semibold", i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-700")}>
                            {day}
                        </div>
                    ))}

                    {/* Padding for start of month - simplified for now, can add empty cells if needed, 
              but grid-cols-7 might need correct starting column. 
              Let's use style={{ gridColumnStart: ... }} */}

                    {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
                    ))}

                    {days.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isHol = holidays.includes(dateStr);
                        const isWkEnd = isSaturday(day) || isSunday(day);

                        // Staff status
                        let staffStatus: 'none' | 'unavailable' | 'preference' = 'none';
                        if (mode === 'staff_constraint' && selectedStaff) {
                            if (selectedStaff.unavailability.includes(dateStr)) staffStatus = 'unavailable';
                            if (selectedStaff.preferences.includes(dateStr)) staffStatus = 'preference';
                        }

                        return (
                            <div
                                key={dateStr}
                                onClick={() => handleDateClick(day)}
                                className={clsx(
                                    "bg-white min-h-[100px] p-2 hover:bg-gray-50 cursor-pointer transition-colors relative flex flex-col justify-between",
                                    (isHol || (isWkEnd && mode !== 'holiday')) && "bg-red-50 hover:bg-red-100", // Visual cue for holiday/weekend
                                    staffStatus === 'unavailable' && "bg-red-100 hover:bg-red-200",
                                    staffStatus === 'preference' && "bg-blue-100 hover:bg-blue-200"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={clsx(
                                        "tnum text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center",
                                        isHol ? "bg-red-500 text-white" : isSunday(day) ? "text-red-500" : isSaturday(day) ? "text-blue-600" : "text-gray-700"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {mode === 'holiday' && isHol && <CalendarIcon size={16} className="text-red-500" />}
                                </div>

                                {mode === 'staff_constraint' && staffStatus !== 'none' && (
                                    <div className="self-end mt-2">
                                        {staffStatus === 'unavailable' && <Ban size={20} className="text-red-500" />}
                                        {staffStatus === 'preference' && <Star size={20} className="text-blue-500" fill="currentColor" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
