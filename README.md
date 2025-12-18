# ShiftSmart

An Angular 21 application with Tailwind CSS.

## Features

- ⚡ Angular 21 - Latest version of Angular
- 🎨 Tailwind CSS 3 - Utility-first CSS framework
- 📦 TypeScript - Type-safe development
- 🔥 Hot Module Replacement - Fast development experience
- 📱 Responsive Design - Mobile-first approach

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v20 or higher)
- npm (v10 or higher)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shiftsmart
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes to the source files.

### Build

Build the project for production:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Running Tests

Execute the unit tests:
```bash
npm test
```

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

## Technologies

- **Angular 21**: Modern web application framework
- **Tailwind CSS 3**: Utility-first CSS framework for rapid UI development
- **TypeScript**: Strongly typed programming language
- **SCSS**: CSS preprocessor for enhanced styling capabilities
- **Vitest**: Fast unit testing framework

## License

This project is licensed under the MIT License.