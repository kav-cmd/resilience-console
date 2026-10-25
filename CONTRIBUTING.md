# Contributing

Thanks for taking a look. This is a small, dependency-free project, so contributing is simple.

## Setup

```bash
git clone https://github.com/kav-cmd/resilience-console.git
cd resilience-console
npx serve .      # open the printed URL
npm test         # Node 22+, nothing to install
```

## Guidelines

- Keep `js/model.js` free of DOM access so it stays testable.
- Content changes (scenarios, scores, text) go in `js/data.js`. Run `npm test`, which validates the shape and ranges of that data.
- If you change a formula or threshold, update the tests and [docs/MODEL.md](docs/MODEL.md) in the same change.
- Keep the page working in light and dark mode and at phone width.
- Values are illustrative. Please do not present them as measurements.

## Reporting issues

Open an issue with the scenario and settings you used (event, persona, operator on or off, weights) and what you expected to see.
