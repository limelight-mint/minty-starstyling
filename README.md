# ✨ | Starstyling

A Minty VS Code extension for personal use to keep spacious and cosy atmosphere in the code with simple OOP-like visuals. 🍃

## Features

- **OOP-style formatting** for JavaScript and TypeScript files 🍃
- **Auto-format on save** (`"starstyling.isFormatOnSave": true`)
- **Manual formatting** (`"starstyling.styleKey": "ctrl+shift+f"`)
- **Project formatting** (`"starstyling.styleKeyEntireProject": "ctrl+shift+a"`)
- **Works with Vue**: Skips `{{ }}` (e.g., `{{ user.Name }}`)
- **Smart exclusions** for build files and dependencies

## Usage

### Automatic Formatting (default: true)
The extension automatically formats your JS/TS files when you save (`Ctrl+S`).

> [!NOTE]  
> All commands starts with `✨ | Starstyle...` in Command Palette.

## Settings Example
> No configuration needed to get started! 🌿✨

> [!TIP]  
> Open VS Code settings (`Ctrl+,`) and search for "starstyling" to customize. Or use `.vscode/settings.json` file to exclude folders or singular files.

Default `.vscode/settings.json` customization (already applied, but u can customize if u want):
```
{
  "starstyling.isFormatOnSave": true,
  "starstyling.styleKey": "ctrl+shift+s",
  "starstyling.styleKeyEntireProject": "ctrl+shift+a",
  "starstyling.excludeFiles": [
    "*.min.js",
    "*.bundle.js",
    "bundle.js",
    "vendor.js"
  ],
  "starstyling.excludeFolders": [
    "node_modules",
    "dist",
    "build",
    ".git"
  ]
}
```

## Working Example

**Before:**
```javascript
function test(){if(true){console.log("hello");}else{console.log("world");}}
```

**After:**
```javascript
function test() 
{
    if(true) 
    {
        console.log("hello");
    } 
    else 
    {
        console.log("world");
    }
}
```

## Contribute and Bugfix
To test the repo clone it (green button up right), open with VS Code, install packages via `npm install`, and press F5 to open dev VS Code.

To build the repo and check your changes type `npm run compile`. Ready for publishing? Type `vsce package` and run the created package.

> This project welcomes any PRs and issues with reasonable comments and same code style. To open an issue please add your code and the result after formatting. (BEFORE:/AFTER: or screenshots)
___
  [![Github ✨](https://img.shields.io/badge/Github-9370DB?&style=for-the-badge&logo=github&logoColor=black)](https://github.com/limelight-mint/minty-starstyling)
  [![Issues 💔](https://img.shields.io/badge/Issues-9370DB?&style=for-the-badge&logo=github&logoColor=black)](https://github.com/limelight-mint/minty-starstyling/issues)
  [![MintyBar 🌺](https://img.shields.io/badge/MintyBar-Hub-9370DB?&style=for-the-badge&logo=google-chrome&logoColor=white)](https://minty.bar/)
