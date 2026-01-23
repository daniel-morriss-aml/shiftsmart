import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-rules-summary',
    templateUrl: './rules-summary.component.html',
    styleUrl: './rules-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesSummaryComponent {
    protected readonly rules = [
        {
            name: 'Weekend Grouping',
            description: 'Weekend shifts are assigned in pairs - if a staff member works a weekend, they work both Saturday and Sunday.',
        },
        {
            name: 'Night Block Assignment',
            description: 'Night shifts are assigned in consecutive blocks (e.g., 3-7 nights in a row) to maintain consistent sleep schedules and avoid isolated single-night shifts.',
        },
        {
            name: 'Week Balance',
            description: 'Staff shifts are balanced between Week 1 and Week 2, with a maximum difference of 1 shift per person to ensure fairness.',
        },
        {
            name: 'Role Substitution',
            description: 'Nurses can substitute for Resident Assistants (RAs) when needed, but RAs cannot fill Nurse-required positions.',
        },
        {
            name: 'Gender Requirements',
            description: 'Each shift must have at least 2 male Resident Assistants (RAs) to meet clinical requirements.',
        },
    ];
}
