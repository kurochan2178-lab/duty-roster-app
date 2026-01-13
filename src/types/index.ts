export type Role = 'staff' | 'admin';

export interface Staff {
    id: string;
    name: string;
    targetWeekdayCount: number;
    targetHolidayCount: number;
    unavailability: string[];
    preferences: string[];
}

export interface DayShift {
    date: string;
    staffId: string | null;
    isHoliday: boolean;
    type: 'weekday' | 'holiday';
}

export type ShiftResult = DayShift[];

export interface Violation {
    date: string;
    type: 'hard' | 'soft';
    message: string;
}

export interface AppState {
    staffList: Staff[];
    holidays: string[];
    currentMonth: string;
    generatedShifts: ShiftResult[];

    addStaff: (staff: Staff) => void;
    updateStaff: (id: string, staff: Partial<Staff>) => void;
    removeStaff: (id: string) => void;
    addHoliday: (date: string) => void;
    removeHoliday: (date: string) => void;
    setMonth: (month: string) => void;
    setGeneratedShifts: (shifts: ShiftResult[]) => void;
}
