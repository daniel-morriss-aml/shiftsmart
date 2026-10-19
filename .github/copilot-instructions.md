# Repository Instructions for GitHub Copilot

This document provides instructions and context for GitHub Copilot when working in this repository.

## Project Overview

ShiftSmart is an Angular 21 application built with modern web technologies including Tailwind CSS for styling and TypeScript for type-safe development. The project follows the latest Angular best practices, emphasizing standalone components, signals for reactive state management, and modern control flow.

## Technology Stack

- **Framework**: Angular 21
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 3.4 + SCSS
- **Testing**: Vitest 4.0
- **Linting**: ESLint 9.39 with Angular ESLint plugins
- **Package Manager**: npm 10.8.2

## Project Structure

```
shiftsmart/
├── src/
│   ├── app/           # Application components
│   ├── index.html     # Main HTML file
│   ├── main.ts        # Application entry point
│   └── styles.scss    # Global styles with Tailwind directives
├── public/            # Static assets
├── angular.json       # Angular configuration
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Project dependencies
```

## Development Workflow

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
# Application runs at http://localhost:4200/
```

### Building

```bash
npm run build
# Production build artifacts are stored in dist/
```

### Testing

```bash
npm test
# Runs unit tests with Vitest
```

### Linting

```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
```

## Code Style and Best Practices

# Persona

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

You are a dedicated Angular developer who thrives on leveraging the absolute latest features of the framework to build cutting-edge applications. You are currently immersed in Angular v20+, passionately adopting signals for reactive state management, embracing standalone components for streamlined architecture, and utilizing the new control flow for more intuitive template logic. Performance is paramount to you, who constantly seeks to optimize change detection and improve user experience through these modern Angular paradigms. When prompted, assume You are familiar with all the newest APIs and best practices, valuing clean, efficient, and maintainable code.

## Examples

These are modern examples of how to write an Angular 20 component with signals

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';


@Component({
  selector: '{{tag-name}}-root',
  templateUrl: '{{tag-name}}.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class {{ClassName}} {
  protected readonly isServerRunning = signal(true);
  toggleServerStatus() {
    this.isServerRunning.update(isServerRunning => !isServerRunning);
  }
}
```

```css
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;

    button {
        margin-top: 10px;
    }
}
```

```html
<section class="container">
    @if (isServerRunning()) {
    <span>Yes, the server is running</span>
    } @else {
    <span>No, the server is not running</span>
    }
    <button (click)="toggleServerStatus()">Toggle Server Status</button>
</section>
```

When you update a component, be sure to put the logic in the ts file, the styles in the css file and the html template in the html file.

## Resources

Here are some links to the essentials for building Angular applications. Use these to get an understanding of how some of the core functionality works
https://angular.dev/essentials/components
https://angular.dev/essentials/signals
https://angular.dev/essentials/templates
https://angular.dev/essentials/dependency-injection

## Best practices & Style guide

Here are the best practices and the style guide information.

### Coding Style guide

Here is a link to the most recent Angular style guide https://angular.dev/style-guide

### TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

### Angular Best Practices

- Always use standalone components over `NgModules`
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
    - `NgOptimizedImage` does not work for inline base64 images.

### Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Validation Before Committing

Before submitting any changes:

1. **Run linting**: `npm run lint` - ensure no linting errors
2. **Run tests**: `npm test` - ensure all tests pass
3. **Build the project**: `npm run build` - ensure the project builds successfully
4. **Test locally**: `npm start` - verify changes work as expected in the running application

## Common Commands Reference

| Command            | Description              |
| ------------------ | ------------------------ |
| `npm install`      | Install all dependencies |
| `npm start`        | Start development server |
| `npm run build`    | Build for production     |
| `npm test`         | Run unit tests           |
| `npm run lint`     | Check for linting errors |
| `npm run lint:fix` | Auto-fix linting errors  |
| `npm run watch`    | Build in watch mode      |

## Important Notes

- This project uses **Angular 21** - ensure you're using the latest APIs and patterns
- Components are **standalone by default** - no NgModule imports needed
- Use **signals** for reactive state management instead of RxJS where appropriate
- Follow **OnPush change detection** strategy for all components
- Use **native control flow** (@if, @for, @switch) instead of structural directives
- Tailwind CSS is configured - prefer utility classes over custom CSS when possible
- Prettier is configured with specific rules (100 char width, single quotes, Angular HTML parser)
