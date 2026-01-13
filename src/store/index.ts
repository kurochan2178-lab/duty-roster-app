import { create } from 'zustand';
import type { AppState } from '../types';


export const useAppStore = create<AppState>((set) => ({
    staffList: [],
    holidays: [],
    currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    generatedShifts: [],

    addStaff: (staff) => set((state) => ({ staffList: [...state.staffList, staff] })),
    updateStaff: (id, updated) => set((state) => ({
        staffList: state.staffList.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    })),
    removeStaff: (id) => set((state) => ({
        staffList: state.staffList.filter((s) => s.id !== id),
    })),
    addHoliday: (date) => set((state) => ({ holidays: [...state.holidays, date] })),
    removeHoliday: (date) => set((state) => ({
        holidays: state.holidays.filter((d) => d !== date),
    })),
    setMonth: (month) => set({ currentMonth: month }),
    setGeneratedShifts: (shifts) => set({ generatedShifts: shifts }),
}));
