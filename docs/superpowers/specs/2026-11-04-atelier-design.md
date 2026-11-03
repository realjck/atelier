# Atelier - Design

Date: 2026-11-04
Sources: `docs/PLAN.md`, `docs/atelier - maquette.jpg`, brainstorming session.

## Intent

Atelier is a personal desktop tool for keeping track of ongoing projects in one place:
what each project is, where it lives on disk, where its remote repository is, and
whether it is published online. Each of those locations should be one click away
(open the folder in Explorer, open the repo, open the live site).

The look follows the mockup: dark UI, violet accent, rounded pills, a single table.

## Goals

- Create, edit and delete projects stored in a local SQLite database.
- List projects in a sortable, searchable, filterable table.
- Open a project's local folder, repository and production site directly from the table.
- Manage categories on the fly, each with a color dot.
- Provide a quick way to open the folder that contains the SQLite database.

## Non-goals

- No sync, no accounts, no multi-user, no cloud.
- No checking whether a production URL actually responds (Online is purely "URL is filled").
- No expandable rows: the chevrons in the mockup are a mockup artifact and must not appear.
- No header counter ("6 total tasks - 2 online" in the mockup is removed).
- No task/subtask management inside a project.

## Anti-goals

- A UI that drifts from the mockup's style (dark, violet, pill badges).
- Clicking a path/repo/URL does nothing visible or fails silently.

## Constraints

- Tauri 2 (Rust) + SQLite.
- UI text and code in English. Conversation with the user in French.
- Platform: Windows first (user's machine is Windows 11). Paths shown as Windows paths.
- App icon = the "A" logo, redrawn as SVG.

## Decided with the user

### Data model

**Project**
| Field | Notes |
|---|---|
| name | required |
| category | optional reference to a category |
| created | date, prefilled with today, editable |
| state | one of the 6 states below, required |
| local path | optional folder path |
| repository URL | optional; provider icon derived from the URL |
| production URL | optional; if filled the project is **Online**, otherwise **Offline** |

**States** (fixed list, not user-editable), each with a color:
| State | Meaning | Color |
|---|---|---|
| Idea | noted, nothing started | light grey |
| Draft | first sketches | lavender (as in mockup) |
| In Progress | active | blue |
| On Hold | paused or waiting on someone (merges "pending" and "on hold") | amber |
| Completed | done | green |
| Archived | put away | dark grey |

**Category**: name + color. Created, renamed and deleted from the Manage Categories panel.

### Main screen

- Top-left: the logo plus the word "Atelier". No subtitle / counter.
- Top-right: search field and a **+ New Project** button (replaces "+ New Task").
- Filter chips row: All, Online, then one chip per state (Idea, Draft, In Progress,
  On Hold, Completed, Archived). Single selection.
  - **All** hides Archived projects. Archived projects only appear via the Archived chip.
  - **Online** shows non-archived projects with a production URL.
- Manage Categories button on the right of the filter row, opening the panel shown in
  the mockup (list with color dot + delete icon, "Add a Category", Cancel / Save).
  Addition vs mockup: choosing a color when adding a category.
- Table columns: Name, Category (colored pill), Created, State (colored pill), Path,
  Repo (provider icon), Status (Online/Offline dot). All columns sortable.
- Click on a row opens the edit modal.
- Click on the path opens the folder in the OS file explorer.
- Click on the repo icon opens the repository URL in the default browser.
- Click on "Online" opens the production URL in the default browser.
  These three clicks must not also open the edit modal.

### Project modal

Large modal, single column with sections (option B validated in the visual companion):
1. Name (large input).
2. Category (dropdown with color dots) and Created (date) side by side.
3. State: pill buttons that wrap, one per state.
4. "Links" section: local path (with a **Browse** button opening the native folder
   picker), repository URL (provider icon shown), production URL (hint: "filled = Online").
5. Footer: "Delete project" on the left (edit mode only), Cancel / Save on the right.

Same modal for create and edit.

### Repository provider detection

From the repository URL host: `github.com` -> GitHub icon, `gitlab.com` (or host
containing `gitlab`) -> GitLab icon, anything else -> generic git icon.

### Logo

Option B from the visual companion: solid geometric "A" with violet gradient
(`#8b6cff` -> `#5b3df5`), a crossbar extending to the left with a thin groove line.
Reference SVG (viewBox 0 0 120 120):

```svg
<path d="M52 14 H68 L106 106 H88 L60 36 L32 106 H14 Z" fill="url(#g)"/>
<rect x="4" y="66" width="90" height="12" fill="url(#g)"/>
<rect x="4" y="70" width="90" height="4" fill="<background>"/>
```

The groove should be a real cut-out (mask) rather than a background-colored rect, so the
logo works on any background and as an app icon. App icon: logo on a dark rounded square.

## Builder's calls (made during brainstorming, user can override)

- Frontend: React + TypeScript + Vite, plain CSS with design tokens (no CSS framework).
- Persistence: `rusqlite` on the Rust side, exposed to the UI through Tauri commands.
  Database file in the app data directory.
- Opening folders/URLs and folder picking through official Tauri plugins (opener, dialog).
- Database location shortcut: a small gear + folder icon in the bottom-right corner that
  opens the folder containing the SQLite file.
- Deleting a category still used by projects sets those projects to "no category".
- Header shows logo + "Atelier" wordmark.
- Manage Categories panel: inline rename and color change on existing categories;
  edits are staged and applied together on Save, discarded on Cancel.
- Opening a local path that no longer exists shows a visible error message.
- Packaging: standard `tauri build` Windows installer, no code signing, no auto-update.

## Left to the builder

- Exact schema, migrations approach, command names.
- Search scope (at least name; path and category name are reasonable additions).
- Default sort (suggestion: created, newest first).
- Exact colors for new states and the category color palette offered in the picker.
- Empty states, validation messages, confirmation before deleting a project.
