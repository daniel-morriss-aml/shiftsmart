export enum RuleViolationSeverity {
    Satisfied = 'Satisfied',
    SoftViolation = 'SoftViolation',
    HardViolation = 'HardViolation',
}

export interface RuleValidation {
    ruleId: string;
    ruleName: string;
    description: string;
    severity: RuleViolationSeverity;
    violationCount: number;
    details: string[];
}

export interface RuleValidationResult {
    rules: RuleValidation[];
    hasHardViolations: boolean;
    hasSoftViolations: boolean;
}
