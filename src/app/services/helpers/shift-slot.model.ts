import { ShiftType } from '../../models';

export interface ShiftSlot {
  date: string;
  shiftType: ShiftType;
  isWeekend: boolean;
  weekNumber: 1 | 2;
  assignedStaff: string[];
  minNurses: number;
  maxNurses: number;
  minRAs: number;
  maxRAs: number;
  maxTotalStaff: number;
}
