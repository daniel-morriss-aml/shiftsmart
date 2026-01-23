import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuleValidationResult, RuleViolationSeverity } from '../../models';

@Component({
    selector: 'app-rule-validation-panel',
    imports: [CommonModule],
    templateUrl: './rule-validation-panel.component.html',
    styleUrl: './rule-validation-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleValidationPanelComponent {
    validationResult = input<RuleValidationResult | undefined>();

    protected readonly RuleViolationSeverity = RuleViolationSeverity;

    protected satisfiedCount = computed(() => {
        const result = this.validationResult();
        if (!result) return 0;
        return result.rules.filter((r) => r.severity === RuleViolationSeverity.Satisfied).length;
    });

    protected softViolationCount = computed(() => {
        const result = this.validationResult();
        if (!result) return 0;
        return result.rules.filter((r) => r.severity === RuleViolationSeverity.SoftViolation).length;
    });

    protected hardViolationCount = computed(() => {
        const result = this.validationResult();
        if (!result) return 0;
        return result.rules.filter((r) => r.severity === RuleViolationSeverity.HardViolation).length;
    });

    protected getIcon(severity: RuleViolationSeverity): string {
        switch (severity) {
            case RuleViolationSeverity.Satisfied:
                return '✓';
            case RuleViolationSeverity.SoftViolation:
                return '⚠';
            case RuleViolationSeverity.HardViolation:
                return '✖';
            default:
                return '';
        }
    }

    protected getSeverityClass(severity: RuleViolationSeverity): string {
        switch (severity) {
            case RuleViolationSeverity.Satisfied:
                return 'text-green-600 bg-green-50 border-green-200';
            case RuleViolationSeverity.SoftViolation:
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case RuleViolationSeverity.HardViolation:
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return '';
        }
    }

    protected getSeverityIconClass(severity: RuleViolationSeverity): string {
        switch (severity) {
            case RuleViolationSeverity.Satisfied:
                return 'text-green-600 text-2xl';
            case RuleViolationSeverity.SoftViolation:
                return 'text-yellow-600 text-2xl';
            case RuleViolationSeverity.HardViolation:
                return 'text-red-600 text-2xl';
            default:
                return '';
        }
    }
}
