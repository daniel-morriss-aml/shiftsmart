# Shift Smart - Hospital Rota Builder TODO

## Project Goal

A web app that takes staff + shift requirements and automatically generates a fair, constraint-aware 2-week rota for a hospital unit.

---

## Phase 1 – Project Setup & Foundations

### Project Configuration

-   [x] Create Angular 21 project (standalone components)
-   [x] Configure routing and basic layout
-   [x] Integrate Tailwind CSS
-   [x] Configure tailwind.config.js
-   [ ] Apply basic layout styles (container, typography, colors)
-   [x] Add ESLint with 250-line limit for .ts and .html files

### Core Models & Enums

-   [x] Define `Role` enum (Nurse, RA)
-   [x] Define `Gender` enum (Male, Female, Other)
-   [x] Define `ShiftType` enum (Day, Night)
-   [x] Define `StaffAvailability` interface
-   [x] Define `ShiftSlotId` type
-   [x] Define `StaffMember` interface
-   [x] Define `ShiftRequirement` interface
-   [x] Define `DayShiftRequirements` interface
-   [x] Define `HospitalConfig` interface
-   [x] Define `ShiftAssignment` interface
-   [x] Define `StaffWorkSummary` interface
-   [x] Define `Rota` interface
-   [x] Define `RotaRules` interface (optional)

### Core Services

-   [x] Create `StaffService` with in-memory storage (using signals)
-   [x] Create `ShiftConfigService` with default requirements (using signals)
-   [x] Create skeleton `RotaEngineService` with `generateRota()` stub
-   [x] Create `RotaStore` service using Angular signals for current rota state

### App Shell & Navigation

-   [x] Create `AppComponent` with top navigation
-   [x] Add navigation links: "Staff", "Shift Setup", "Generate Rota", "Settings"
-   [ ] (Optional) Create `SidebarNavigationComponent` for progress/steps

---

## Phase 2 – Staff Data Management

### Staff List

-   [ ] Create `StaffListComponent`
-   [ ] Display staff table/list (Name, Role, Gender, Shifts per 2 weeks, weekend eligibility)
-   [ ] Add dummy data for testing
-   [ ] Add actions: add, edit, delete
-   [ ] Add indicators for impossible constraints (e.g., 7 shifts but only 3 available slots)

### Staff Form

-   [ ] Create `StaffFormComponent`
-   [ ] Add form fields: Name, Gender, Role
-   [ ] Add availability options: Can work days? nights? weekends?
-   [ ] Add number of shifts per 2 weeks field
-   [ ] Add validations:
    -   [ ] Shifts per fortnight > 0
    -   [ ] At least one shift type/day available
-   [ ] Connect to `StaffService` for CRUD operations

### Staff Availability Grid

-   [ ] Create `StaffAvailabilityGridComponent`
-   [ ] Build 7 days × 2 weeks × Day/Night grid UI
-   [ ] Implement Tailwind grid layout
-   [ ] Add quick toggling of availability
-   [ ] Integrate with `StaffFormComponent`

### Data Persistence

-   [ ] Implement localStorage persistence for staff data
-   [ ] Add load/save functionality in `StaffService`

---

## Phase 3 – Shift & Hospital Configuration

### Basic Shift Configuration

-   [ ] Create `ShiftConfigComponent`
-   [ ] Display default day requirements (Min/max Nurses & RAs, Max total staff)
-   [ ] Display default night requirements
-   [ ] Add edit functionality for requirements
-   [ ] Add live validation:
    -   [ ] maxTotalStaff ≥ minNurses + minRAs
    -   [ ] min values ≤ max values
-   [ ] Integrate with `ShiftConfigService`

### Calendar-Specific Configuration (Optional Advanced)

-   [ ] Create `CalendarShiftConfigComponent`
-   [ ] Display 14-day calendar
-   [ ] Allow date-specific requirement overrides
-   [ ] Add small cards for each date
-   [ ] Implement override logic in `ShiftConfigService`

---

## Phase 4 – Basic Rota Generation & Grid

### Initial Rota Engine

-   [ ] Implement basic `RotaEngineService.generateRota()` v1:
    -   [ ] Build list of ShiftSlot objects for 14 days × 2 shifts
    -   [ ] Tag slots as weekend/weekday
    -   [ ] Simple assignment logic (ignore advanced rules initially)
    -   [ ] Fill shifts to meet min requirements
    -   [ ] Respect staff availability
    -   [ ] Respect role (Nurse/RA)
    -   [ ] Compute `StaffWorkSummary`

### Rota Generation UI

-   [ ] Create `RotaGenerationComponent`
-   [ ] Add period start date selector (defaults to next Monday)
-   [ ] Add "Generate Rota" button
-   [ ] Call `RotaEngineService.generateRota()`
-   [ ] Show errors if staff/requirements are insufficient
-   [ ] Display loading state during generation

### Rota Display

-   [ ] Create `RotaGridComponent`
-   [ ] Display 2-week schedule grid
-   [ ] Implement date rows/columns structure
-   [ ] Add Day/Night grouping
-   [ ] Highlight weekends
-   [ ] Highlight nights
-   [ ] Add hover to see shift details
-   [ ] Color-code cells for Days vs Nights

### Staff Summary

-   [ ] Create `RotaStaffSummaryComponent`
-   [ ] Display total shifts per staff member
-   [ ] Show Week 1 vs Week 2 breakdown
-   [ ] Show Nights vs Days count
-   [ ] Show weekend count
-   [ ] Highlight if target `shiftsPerFortnight` is met

---

## Phase 5 – Add Business Rules & Validation

### Weekend Rule

-   [ ] Update `RotaEngineService` for weekend assignment:
    -   [ ] Assign 1 weekend per eligible staff
    -   [ ] Group weekend shifts (same person Sat & Sun)
    -   [ ] Respect "cannot work weekends" flag
    -   [ ] Satisfy min staff requirements

### Night Block Rule

-   [ ] Update `RotaEngineService` for night block assignment:
    -   [ ] Assign blocks of continuous nights
    -   [ ] Prefer 1 week of nights followed by 1 week of days
    -   [ ] Respect availability (no nights if not allowed)
    -   [ ] Avoid single isolated night shifts

### Week 1/Week 2 Balance

-   [ ] Add balance logic to `RotaEngineService`:
    -   [ ] Score assignments based on Week 1 vs Week 2 distribution
    -   [ ] Keep difference ≤ 1 shift per staff where possible
    -   [ ] Penalize uneven distribution in assignment scoring

### Nurse ↔ RA Substitution Rule

-   [ ] Implement substitution logic:
    -   [ ] First fill Nurse requirements with Nurses
    -   [ ] Fill RA requirements with RAs
    -   [ ] Allow Nurses to substitute for RAs when short
    -   [ ] Never allow RAs to fill Nurse-required slots

### Gender Rule (Min 2 Male RAs per Shift)

-   [ ] Add post-processing pass for gender rule:
    -   [ ] Check each shift for at least 2 male RAs
    -   [ ] Attempt swaps from other shifts if not satisfied
    -   [ ] Flag violations if impossible to resolve

### Rule Validation UI

-   [ ] Create `RulesS ummaryComponent`
-   [ ] Display active rules in plain language
-   [ ] Add explanations for clinical stakeholders

-   [ ] Create `RuleValidationPanelComponent`
-   [ ] Show ✔ Rule satisfied
-   [ ] Show ⚠ Soft violation (e.g., week balance off by 2)
-   [ ] Show ✖ Hard violation (e.g., < 2 male RAs on shift)
-   [ ] Summarize how many shifts/people impacted
-   [ ] Display panel after rota generation

---

## Phase 6 – UX Polish & Export

### Styling & Theme

-   [ ] Improve Tailwind styling:
    -   [ ] Clean typography
    -   [ ] Consistent card designs
    -   [ ] Professional buttons and form controls
    -   [ ] Color-coded tags for Days/Nights
    -   [ ] Role badges for Nurse/RA
    -   [ ] Gender indicators
    -   [ ] Responsive design for mobile/tablet

### Manual Adjustments

-   [ ] Create `RotaShiftDetailDialogComponent`
-   [ ] Add click handler on `RotaGridComponent` cells
-   [ ] Display list of assigned staff for selected shift
-   [ ] Show rule check status for the shift
-   [ ] Add manual add/remove staff functionality
-   [ ] Implement drag-and-drop for staff swaps (optional)
-   [ ] Re-run validation after manual changes
-   [ ] Update `RuleValidationPanelComponent` on changes

### Export Functionality

-   [ ] Create `RotaExportComponent`
-   [ ] Implement CSV export:
    -   [ ] Generate CSV with dates, shifts, staff assignments
    -   [ ] Download functionality
-   [ ] Implement print-friendly layout:
    -   [ ] Add CSS print styles
    -   [ ] PDF-like layout
    -   [ ] Page breaks at appropriate points
-   [ ] Add anonymization option for public posting

### Utility Components

-   [ ] Create `LoadingSpinnerComponent`
-   [ ] Create `ToastNotificationComponent`
-   [ ] Create reusable button components
-   [ ] Create reusable card components
-   [ ] Create reusable grid components

---

## Future Enhancements (Post-MVP)

### Integration & Deployment

-   [ ] REST API integration (replace localStorage)
-   [ ] Database setup (PostgreSQL/MongoDB)
-   [ ] User authentication & authorization
-   [ ] Multi-user/multi-hospital support
-   [ ] Role-based access control

### Advanced Features

-   [ ] "Regenerate keeping manual edits" option
-   [ ] Rota history & versioning
-   [ ] Staff request/swap system
-   [ ] Notification system for staff assignments
-   [ ] Mobile app for staff view
-   [ ] Advanced constraint solver (beyond greedy heuristic)
-   [ ] AI-powered optimization suggestions
-   [ ] Conflict resolution wizard
-   [ ] Staff fatigue tracking
-   [ ] Compliance reporting
-   [ ] Integration with hospital HR systems

### Analytics & Reporting

-   [ ] Staff workload analytics dashboard
-   [ ] Fairness metrics over time
-   [ ] Compliance reports
-   [ ] Export to hospital management systems

---

## Current Status

**Active Phase:** Phase 1 – Project Setup & Foundations  
**Last Updated:** December 18, 2025

### Completed

-   Angular 21 project created with standalone components
-   Tailwind CSS integrated and configured
-   ESLint configured with 250-line limit for .ts and .html files
-   Project structure established

### In Progress

-   Core models and enums (not started)
-   Core services (not started)

### Blockers

None currently

---

## Notes & Decisions

-   Using standalone components (Angular 21)
-   Tailwind CSS for styling
-   localStorage for MVP (will migrate to API later)
-   Starting with greedy heuristic for scheduling (can refine later)
-   250-line file limit enforced via ESLint
-   Test files configured separately from app files
