# Contributing To Our Repository

Thank you for your interest in contributing to our repository. This document outlines the mandatory development standards, quality assurance protocols, and architectural principles required for all submissions. We enforce a strict, production-grade workflow to maintain system integrity and scalability.

## 1. Development Environment & Quality Assurance

To ensure consistency and reliability, the repository employs a rigorous suite of automated tools for linting, formatting, and testing. All contributions must adhere to these verification protocols before submission.

### 1.1 Prerequisites

* **Runtime:** Node.js **v24.0.0** or higher is strictly required.
* **Package Management:** The project utilizes standard `npm` workflows.

### 1.2 Automated Verification Workflows

We utilize a two-tier script system to manage code quality. You are expected to utilize these commands frequently during development to ensure your code complies with project standards.

* **Auto-Remediation**
This is the primary command for local development. It executes the full suite of auto-fixers in the following order:
1. **Dependency Fixes:** Resolves internal dependency issues via `fix-deps`.
2. **Type Generation:** Regenerates necessary TypeScript definitions via `generate-types`.
3. **Formatting:** Applies Prettier formatting rules to all files.
4. **Linting:** Automatically fixes auto-correctable ESLint errors.

```bash
npm run fix-deps
npm run fix-code
```

* **Comprehensive Verification**
This command simulates the Continuous Integration (CI) pipeline locally. It performs a read-only analysis to ensure zero violations:
1. **Type Safety:** Runs strict TypeScript compilation checks (`test:types`) for client, server, and balancer configurations.
2. **Linting Analysis:** Scans for code quality and security issues.
3. **Format Verification:** Ensures strict adherence to Prettier style guides.
4. **Unit Testing:** Executes Vitest suites with coverage reporting.

```bash
npm run check
```

### 1.3 Pre-Commit Enforcement (Husky)

This repository protects the codebase through strict **Git Hooks** configured via Husky.

* **Automatic Validation:** Upon attempting a commit, the system automatically triggers the `lint-staged` process, which runs the `npm run check` pipeline on your staged files.
* **Zero-Tolerance Policy:** Any commit that fails type checking, linting, formatting, or unit tests will be automatically rejected. **Do not bypass these hooks.**

## 2. Core Coding Standards & Architecture

Our repository enforces a highly specific coding style designed to eliminate technical debt and ensure long-term maintainability. These standards are not suggestions; they are hard constraints enforced by our custom ESLint rules.

### 2.1 The "Zero-Comment" Policy (Self-Documenting Code)

We adhere to a strict philosophy that code must be intrinsically self-explanatory. If a block of code requires a comment to be understood, it is considered defective and must be refactored.

* **Prohibition:** The use of inline comments (`//`), block comments (`/* */`), or JSDoc strings is **strictly prohibited**.
* **Requirement:** You must use precise, descriptive naming conventions for variables and functions. Logic should be broken down into small, atomic units where the intent is obvious from the syntax itself.
* **Rationale:** Comments drift from implementation over time, creating false documentation. Code never lies.

### 2.2 Functional Definition Syntax

To ensure consistent lexical scoping and prevent hoisting-related side effects, the use of the `function` keyword for declarations is forbidden.

* **Required Syntax:** All functions must be defined as `const` assignments using arrow functions or function expressions.
```typescript
// ✅ ACCEPTED
const processData = (data: string): void => { ... };

// ❌ REJECTED
function processData(data: string) { ... }
```

### 2.3 Complexity & Size Limits

We enforce rigorous limits on code volume to prevent monolithic "god objects" and ensure every component is testable.

* **Single Responsibility:** Each function must perform exactly one task.
* **Cyclomatic Complexity:** No function may exceed a complexity score of **30**.
* **Function Length:** Strictly limited to **200 lines**.
* **File Length:** Strictly limited to **500 lines**.

### 2.4 Error Handling Protocols

Silent failures are strictly forbidden. All error pathways must be explicitly handled.

* **No Empty Catch Blocks:** blindly suppressing errors is a critical violation.
* **Typed Errors:** Use custom error types to provide granular context for debugging and UI feedback.

## 3. Git Workflow & Submission Protocols

To maintain a clean and semantic history, we enforce a structured Git workflow. All contributors must adhere to these protocols; deviations will result in rejected Pull Requests.

### 3.1 Initialization & Branching

Direct commits to the `main` branch are restricted. All development must occur on isolated feature branches.

1. **Fork & Clone:** Fork the repository and clone it to your local machine.
2. **Dependency Installation:**
```bash
npm install
```

*Note: This automatically triggers the `prepare` script to configure Husky git hooks.*

Use the **kebab-case naming** branch convention:
* `user-authentication`
* `memory-leak-session-controller`
* `api-guide-update`

### 3.2 Pull Request (PR) Standards

Before submitting a PR, ensure the following criteria are met:

1. **Sync:** Ensure your branch is up-to-date with the upstream `main` branch.
2. **Verification:** Run `npm run check` locally to confirm all tests and linting rules pass.
3. **Linkage:** Clearly reference the issue IDs being addressed in the description (e.g., "Fixes #142").

---

## 4. Legal & Community

* **Code of Conduct:** We maintain a professional, merit-based environment. All interactions must remain technical, objective, and respectful.
* **Contribution License:** By submitting a Pull Request, you certify that you own the rights to your code and grant the project maintainers an irrevocable, non-exclusive, transferable, and royalty-free right to use, modify, distribute, and relicense your contribution. This provision ensures the project can transition to an open-source license in the future without legal friction.
* **Rights:** The project maintainers reserve the exclusive right to decide the strategic direction of the platform, including the rejection of contributions that do not align with the architectural vision or quality standards.
