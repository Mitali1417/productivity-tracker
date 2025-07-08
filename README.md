# Productivity Tracker Chrome Extension

Track your browsing habits, set daily goals, and boost productivity with insights and focus tools.

## Features
- Real-time tracking of website usage
- Set daily productivity goals
- Focus mode and notifications
- Insights and statistics
- Options and popup UI built with React

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation
1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd <project-directory>
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   pnpm install
   ```

### Development
To start the development server (for popup/options UI):
```sh
npm run dev
# or
pnpm dev
```

### Build
To build the extension for production:
```sh
npm run build
# or
pnpm build
```
The build output will be in the `dist/` folder.

### Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Manual Testing
- Click the extension icon to open the popup
- Use the options page to configure settings
- Browse websites to see tracking in action
- Check Chrome DevTools for errors (popup/options/background)

### Linting
To check code quality:
```sh
npm run lint
# or
pnpm lint
```

## Contributing
- Fork the repository
- Create a new branch for your feature or bugfix
- Submit a pull request

## License
MIT # productivity-tracker
