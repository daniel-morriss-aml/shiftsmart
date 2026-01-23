import { TestBed } from '@angular/core/testing';
import { ShiftConfigService } from './shift-config.service';
import { ShiftType } from '../models';

describe('ShiftConfigService', () => {
  let service: ShiftConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(ShiftConfigService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const config = service.hospitalConfig();

      expect(config).toBeTruthy();
      expect(config.id).toBe('default');
      expect(config.name).toBe('Default Hospital');
      expect(config.defaultDayRequirement).toBeDefined();
      expect(config.defaultNightRequirement).toBeDefined();
    });

    it('should load configuration from localStorage if available', () => {
      const customConfig = {
        id: 'custom',
        name: 'Custom Hospital',
        defaultDayRequirement: {
          shiftType: ShiftType.Day,
          minNurses: 3,
          maxNurses: 5,
          minRAs: 7,
          maxRAs: 9,
          maxTotalStaff: 14,
        },
        defaultNightRequirement: {
          shiftType: ShiftType.Night,
          minNurses: 2,
          maxNurses: 3,
          minRAs: 2,
          maxRAs: 4,
          maxTotalStaff: 6,
        },
      };

      localStorage.setItem('shiftsmart_config', JSON.stringify(customConfig));

      // Create a new instance by destroying and recreating the test bed
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ShiftConfigService);
      const config = newService.hospitalConfig();

      expect(config.id).toBe('custom');
      expect(config.name).toBe('Custom Hospital');
      expect(config.defaultDayRequirement.minNurses).toBe(3);

      // Clean up for next tests
      localStorage.clear();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem('shiftsmart_config', 'invalid json {');

      // Should not throw and should use defaults
      const newService = TestBed.inject(ShiftConfigService);
      const config = newService.hospitalConfig();

      expect(config.id).toBe('default');
      expect(config.name).toBe('Default Hospital');
    });
  });

  describe('updateDayRequirement', () => {
    it('should update day requirement and save to storage', () => {
      const newRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 3,
        maxNurses: 5,
        minRAs: 7,
        maxRAs: 9,
        maxTotalStaff: 14,
      };

      service.updateDayRequirement(newRequirement);

      const config = service.hospitalConfig();
      expect(config.defaultDayRequirement).toEqual(newRequirement);

      // Verify it's saved to localStorage
      const stored = localStorage.getItem('shiftsmart_config');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.defaultDayRequirement).toEqual(newRequirement);
    });

    it('should not affect night requirement when updating day requirement', () => {
      const originalNightReq = service.hospitalConfig().defaultNightRequirement;

      const newDayRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 3,
        maxNurses: 5,
        minRAs: 7,
        maxRAs: 9,
        maxTotalStaff: 14,
      };

      service.updateDayRequirement(newDayRequirement);

      const config = service.hospitalConfig();
      expect(config.defaultNightRequirement).toEqual(originalNightReq);
    });
  });

  describe('updateNightRequirement', () => {
    it('should update night requirement and save to storage', () => {
      const newRequirement = {
        shiftType: ShiftType.Night,
        minNurses: 1,
        maxNurses: 2,
        minRAs: 1,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      service.updateNightRequirement(newRequirement);

      const config = service.hospitalConfig();
      expect(config.defaultNightRequirement).toEqual(newRequirement);

      // Verify it's saved to localStorage
      const stored = localStorage.getItem('shiftsmart_config');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.defaultNightRequirement).toEqual(newRequirement);
    });

    it('should not affect day requirement when updating night requirement', () => {
      const originalDayReq = service.hospitalConfig().defaultDayRequirement;

      const newNightRequirement = {
        shiftType: ShiftType.Night,
        minNurses: 1,
        maxNurses: 2,
        minRAs: 1,
        maxRAs: 3,
        maxTotalStaff: 5,
      };

      service.updateNightRequirement(newNightRequirement);

      const config = service.hospitalConfig();
      expect(config.defaultDayRequirement).toEqual(originalDayReq);
    });
  });

  describe('updateHospitalName', () => {
    it('should update hospital name and save to storage', () => {
      const newName = 'Test Hospital';

      service.updateHospitalName(newName);

      const config = service.hospitalConfig();
      expect(config.name).toBe(newName);

      // Verify it's saved to localStorage
      const stored = localStorage.getItem('shiftsmart_config');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.name).toBe(newName);
    });

    it('should preserve other config fields when updating name', () => {
      const originalDayReq = service.hospitalConfig().defaultDayRequirement;
      const originalNightReq = service.hospitalConfig().defaultNightRequirement;

      service.updateHospitalName('New Name');

      const config = service.hospitalConfig();
      expect(config.defaultDayRequirement).toEqual(originalDayReq);
      expect(config.defaultNightRequirement).toEqual(originalNightReq);
    });
  });

  describe('validateRequirement', () => {
    it('should return no errors for valid requirement', () => {
      const validRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 2,
        maxNurses: 4,
        minRAs: 6,
        maxRAs: 8,
        maxTotalStaff: 12,
      };

      const errors = service.validateRequirement(validRequirement);

      expect(errors).toEqual([]);
    });

    it('should detect negative minimum nurses', () => {
      const invalidRequirement = {
        shiftType: ShiftType.Day,
        minNurses: -1,
        maxNurses: 4,
        minRAs: 6,
        maxRAs: 8,
        maxTotalStaff: 12,
      };

      const errors = service.validateRequirement(invalidRequirement);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Minimum nurses'))).toBe(true);
    });

    it('should detect negative minimum RAs', () => {
      const invalidRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 2,
        maxNurses: 4,
        minRAs: -2,
        maxRAs: 8,
        maxTotalStaff: 12,
      };

      const errors = service.validateRequirement(invalidRequirement);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Minimum RAs'))).toBe(true);
    });

    it('should detect max nurses less than min nurses', () => {
      const invalidRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 5,
        maxNurses: 3,
        minRAs: 6,
        maxRAs: 8,
        maxTotalStaff: 12,
      };

      const errors = service.validateRequirement(invalidRequirement);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Maximum nurses'))).toBe(true);
    });

    it('should detect max RAs less than min RAs', () => {
      const invalidRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 2,
        maxNurses: 4,
        minRAs: 9,
        maxRAs: 6,
        maxTotalStaff: 15,
      };

      const errors = service.validateRequirement(invalidRequirement);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Maximum RAs'))).toBe(true);
    });

    it('should detect maxTotalStaff less than minimum requirements', () => {
      const invalidRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 3,
        maxNurses: 4,
        minRAs: 6,
        maxRAs: 8,
        maxTotalStaff: 5, // Less than minNurses (3) + minRAs (6) = 9
      };

      const errors = service.validateRequirement(invalidRequirement);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('minimum nurses + minimum RAs'))).toBe(true);
    });

    it('should detect maxTotalStaff less than maximum requirements', () => {
      const invalidRequirement = {
        shiftType: ShiftType.Day,
        minNurses: 2,
        maxNurses: 4,
        minRAs: 6,
        maxRAs: 8,
        maxTotalStaff: 10, // Less than maxNurses (4) + maxRAs (8) = 12
      };

      const errors = service.validateRequirement(invalidRequirement);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('maximum nurses + maximum RAs'))).toBe(true);
    });

    it('should detect multiple validation errors', () => {
      const invalidRequirement = {
        shiftType: ShiftType.Day,
        minNurses: -1,
        maxNurses: 0,
        minRAs: -2,
        maxRAs: 1,
        maxTotalStaff: 0,
      };

      const errors = service.validateRequirement(invalidRequirement);

      expect(errors.length).toBeGreaterThan(2);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset to default configuration', () => {
      // First, change the configuration
      service.updateHospitalName('Custom Hospital');
      service.updateDayRequirement({
        shiftType: ShiftType.Day,
        minNurses: 10,
        maxNurses: 15,
        minRAs: 20,
        maxRAs: 25,
        maxTotalStaff: 40,
      });

      // Verify it changed
      expect(service.hospitalConfig().name).toBe('Custom Hospital');

      // Reset to defaults
      service.resetToDefaults();

      const config = service.hospitalConfig();
      expect(config.id).toBe('default');
      expect(config.name).toBe('Default Hospital');
      expect(config.defaultDayRequirement.minNurses).toBe(2);
      expect(config.defaultDayRequirement.maxNurses).toBe(4);
      expect(config.defaultNightRequirement.minNurses).toBe(2);
      expect(config.defaultNightRequirement.maxNurses).toBe(3);
    });

    it('should save defaults to localStorage', () => {
      service.updateHospitalName('Custom Hospital');

      service.resetToDefaults();

      const stored = localStorage.getItem('shiftsmart_config');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe('default');
      expect(parsed.name).toBe('Default Hospital');
    });
  });

  describe('signal reactivity', () => {
    it('should expose readonly signal', () => {
      const config = service.hospitalConfig();

      expect(config).toBeTruthy();
      // Signal should be readonly (can't directly set)
      expect(typeof service.hospitalConfig).toBe('function');
    });

    it('should update signal when configuration changes', () => {
      const initialName = service.hospitalConfig().name;

      service.updateHospitalName('New Hospital Name');

      const updatedName = service.hospitalConfig().name;
      expect(updatedName).not.toBe(initialName);
      expect(updatedName).toBe('New Hospital Name');
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage setItem errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('localStorage is full');
      };

      // Should not throw when saving fails
      expect(() => {
        service.updateHospitalName('Test Name');
      }).not.toThrow();

      // Restore original implementation
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle localStorage getItem errors gracefully', () => {
      // Clear test bed
      TestBed.resetTestingModule();
      
      // Set valid data first
      localStorage.setItem('shiftsmart_config', JSON.stringify({ name: 'Test' }));

      // Mock localStorage.getItem to throw an error
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error('localStorage error');
      };

      // Should not throw when loading fails
      expect(() => {
        TestBed.configureTestingModule({});
        TestBed.inject(ShiftConfigService);
      }).not.toThrow();

      // Restore original implementation
      Storage.prototype.getItem = originalGetItem;
      
      // Clean up
      localStorage.clear();
    });
  });
});
