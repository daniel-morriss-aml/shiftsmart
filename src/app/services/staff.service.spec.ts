import { TestBed } from '@angular/core/testing';
import { StaffService } from './staff.service';
import { Gender, Role } from '../models';

describe('StaffService', () => {
  let service: StaffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaffService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportStaffList', () => {
    it('should export staff list as JSON string', () => {
      const testStaff = {
        id: '1',
        name: 'Test User',
        gender: Gender.Male,
        role: Role.Nurse,
        availability: {
          canWorkDays: true,
          canWorkNights: false,
          canWorkWeekends: true,
        },
        shiftsPerFortnight: 7,
      };

      service.addStaff(testStaff);
      const exported = service.exportStaffList();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('Test User');
    });

    it('should export empty array when no staff', () => {
      const exported = service.exportStaffList();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });
  });

  describe('importStaffList', () => {
    it('should import valid staff list', () => {
      const validJson = JSON.stringify([
        {
          id: '1',
          name: 'Alice',
          gender: 'Female',
          role: 'Nurse',
          availability: {
            canWorkDays: true,
            canWorkNights: true,
            canWorkWeekends: true,
          },
          shiftsPerFortnight: 7,
        },
      ]);

      const result = service.importStaffList(validJson);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(service.staff().length).toBe(1);
      expect(service.staff()[0].name).toBe('Alice');
    });

    it('should reject non-array data', () => {
      const invalidJson = JSON.stringify({ not: 'an array' });

      const result = service.importStaffList(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expected an array');
      expect(service.staff().length).toBe(0);
    });

    it('should reject invalid JSON', () => {
      const invalidJson = 'not valid json {';

      const result = service.importStaffList(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(service.staff().length).toBe(0);
    });

    it('should reject staff members with missing required fields', () => {
      const invalidStaff = JSON.stringify([
        {
          id: '1',
          name: 'Incomplete',
          // missing gender, role, availability, shiftsPerFortnight
        },
      ]);

      const result = service.importStaffList(invalidStaff);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid staff member format');
      expect(service.staff().length).toBe(0);
    });

    it('should reject staff members with invalid availability', () => {
      const invalidStaff = JSON.stringify([
        {
          id: '1',
          name: 'Alice',
          gender: 'Female',
          role: 'Nurse',
          availability: {
            canWorkDays: true,
            // missing canWorkNights and canWorkWeekends
          },
          shiftsPerFortnight: 7,
        },
      ]);

      const result = service.importStaffList(invalidStaff);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid staff member format');
      expect(service.staff().length).toBe(0);
    });
  });

  describe('downloadStaffList', () => {
    it('should trigger download', () => {
      // This test verifies the method exists and doesn't throw
      // Actual download behavior is tested manually
      expect(() => service.downloadStaffList()).not.toThrow();
    });
  });
});
