# Atelier

A desktop tool for keeping track of personal projects: name, category, state, local folder,
repository and production URL, with one-click access to each of them.

Built with Tauri 2 (Rust + SQLite) and React + TypeScript.

## Requirements

- Node.js 22+
- Rust stable (see [Tauri prerequisites](https://tauri.app/start/prerequisites/))
- Windows: WebView2 (preinstalled on Windows 11)

## Development

```sh
npm install
npm run tauri dev
```

## Checks

```sh
npm test          # UI tests (Vitest)
npm run lint      # TypeScript type check
cd src-tauri
cargo test        # data layer tests
cargo clippy -- -D warnings
```

## Release build

```sh
npm run tauri build
```

Installers are written to `src-tauri/target/release/bundle/`.

## Data

Projects are stored in a SQLite file, `atelier.db`, in the app data folder
(`%APPDATA%\com.atelier.app\` on Windows). The gear-and-folder button in the bottom-right
corner of the app opens that folder.
