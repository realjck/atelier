# Atelier

A desktop tool for keeping track of personal projects: where each one lives on disk, where its
repository is, and whether it is online, all one click away.

![Atelier](docs/screenshot.png)

Built with Tauri 2 (Rust + SQLite) and React + TypeScript.

## Features

- **Projects** with a name, category, creation date, state (Idea, Draft, In Progress, On Hold,
  Completed, Archived), local folder, repository URL and production URL. A project with a
  production URL is shown as Online.
- **One-click access**: open the folder in File Explorer, the repository (GitHub, GitLab or
  other) or the live site in the browser.
- **Filters, search and sorting**. Archived projects are hidden unless the Archived filter
  is selected.
- **Categories** with colors, managed on the fly from the Manage Categories panel.
- **Local data**: a single SQLite file (`%APPDATA%\com.atelier.app\atelier.db`), whose folder
  opens from the gear button in the bottom-right corner.

## Development

Requires Node.js 22+ and Rust stable (see [Tauri prerequisites](https://tauri.app/start/prerequisites/)).

```sh
npm install
npm run tauri dev     # run the app (uses the same database as the installed app)
npm test              # UI tests
npm run lint          # type check
cargo test --manifest-path src-tauri/Cargo.toml   # data layer tests
npm run tauri build   # installers in src-tauri/target/release/bundle/
```
