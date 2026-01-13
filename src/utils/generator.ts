import type { Staff, ShiftResult, DayShift } from '../types';
import { eachDayOfInterval, startOfMonth, endOfMonth, isSaturday, isSunday, format, parseISO, addDays } from 'date-fns';

export interface GenerationResult {
    patternId: string;
    score: number;
    shifts: ShiftResult;
    violations: Violation[];
}

export interface Violation {
    date: string;
    type: 'hard' | 'soft';
    message: string;
}

const COST = {
    UNAVAILABLE: 10000,
    CONSECUTIVE: 5000,
    NO_PREFERENCE: 100, // Cost for NOT satisfying preference? No, preference should be negative cost
    PREFERENCE: -1000,
    COUNT_DEVIATION: 50,
};

export async function generateRoster(
    yearMonth: string,
    staffList: Staff[],
    holidays: string[]
): Promise<GenerationResult[]> {

    const start = startOfMonth(parseISO(yearMonth + '-01'));
    const end = endOfMonth(start);
    const days = eachDayOfInterval({ start, end });

    const results: GenerationResult[] = [];
    const NUM_PATTERNS = 3;

    for (let i = 0; i < NUM_PATTERNS; i++) {
        // Randomized order of days could vary, but usually we fill sequentially or random.
        // Let's try filling sequentially but with randomized choices.

        // Create deep copy of staff to track temp counts
        const tempStaffState = staffList.map(s => ({
            ...s,
            currentWeekdayCount: 0,
            currentHolidayCount: 0,
            lastAssignedDate: null as string | null,
        }));

        const shifts: DayShift[] = [];
        const violations: Violation[] = [];
        let totalScore = 100;

        for (const day of days) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isHol = holidays.includes(dateStr) || isSaturday(day) || isSunday(day);

            // Calculate costs for each staff
            const candidates = tempStaffState.map(staff => {
                let cost = 0;
                let violationMsg = '';

                // 1. Unavailability (Hard-ish)
                if (staff.unavailability.includes(dateStr)) {
                    cost += COST.UNAVAILABLE;
                    violationMsg = '不可日';
                }

                // 2. Consecutive (Hard-ish / Soft)
                if (staff.lastAssignedDate) {
                    const lastDate = parseISO(staff.lastAssignedDate);
                    if (format(lastDate, 'yyyy-MM-dd') === format(addDays(day, -1), 'yyyy-MM-dd')) {
                        cost += COST.CONSECUTIVE;
                        if (!violationMsg) violationMsg = '連直';
                    }
                }

                // 3. Preference (Bonus)
                if (staff.preferences.includes(dateStr)) {
                    cost += COST.PREFERENCE;
                }

                // 4. Target Count (Soft)
                const currentCount = isHol ? staff.currentHolidayCount : staff.currentWeekdayCount;
                const targetCount = isHol ? staff.targetHolidayCount : staff.targetWeekdayCount;

                // Penalize if current is exceeding target
                if (currentCount >= targetCount) {
                    cost += COST.COUNT_DEVIATION * (currentCount - targetCount + 1);
                } else {
                    // Encourage satisfying target (small negative cost)
                    cost -= 10;
                }

                return { id: staff.id, cost, violationMsg };
            });

            // Sort by cost, but add some randomness to avoid identical patterns
            // We will pick from the top 3 candidates with probability
            candidates.sort((a, b) => a.cost - b.cost);

            // Select logic: Pick one of the best few.
            // If best has very high cost (violation), we still have to pick someone (or empty).
            // Let's pick index 0 with high prob, index 1 with lower...
            // Unless cost difference is huge.

            let selectedCandidate = candidates[0];
            if (i > 0 && candidates.length > 1) { // For patterns 2, 3, add randomness
                const coin = Math.random();
                if (coin > 0.7 && candidates[1].cost < COST.UNAVAILABLE) {
                    selectedCandidate = candidates[1];
                } else if (coin > 0.9 && candidates.length > 2 && candidates[2].cost < COST.UNAVAILABLE) {
                    selectedCandidate = candidates[2];
                }
            }

            // Assign
            const assignedStaff = tempStaffState.find(s => s.id === selectedCandidate.id)!;

            // Update state
            if (isHol) assignedStaff.currentHolidayCount++;
            else assignedStaff.currentWeekdayCount++;
            assignedStaff.lastAssignedDate = dateStr;

            // Check violation
            if (selectedCandidate.cost >= 1000) { // Arbitrary threshold for "Violation"
                violations.push({
                    date: dateStr,
                    type: 'soft',
                    message: `${assignedStaff.name}: ${selectedCandidate.violationMsg || '最適化困難'}`,
                });
                totalScore -= 10;
            }

            // Additional check: Did we ignore a preference?
            // If someone ELSE had a preference on this day and wasn't chosen, is it a violation?
            // Maybe not a violation, but a missed opportunity.
            // Let's strictly report explicit bad things.

            shifts.push({
                date: dateStr,
                staffId: assignedStaff.id,
                isHoliday: isHol,
                type: isHol ? 'holiday' : 'weekday',
            });
        }

        // Normalize score
        totalScore = Math.max(0, totalScore);

        results.push({
            patternId: `pattern-${i + 1}`,
            score: totalScore + (Math.floor(Math.random() * 5)), // Slight variance for UI
            shifts,
            violations
        });
    }

    // Artificial delay for UX
    return new Promise(resolve => setTimeout(() => resolve(results), 800));
}
