use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};

use rusqlite::Connection;
use tauri::{AppHandle, State as TauriState};
use tauri_plugin_opener::OpenerExt;

use crate::error::{AppError, AppResult};
use crate::models::{Category, CategoryDraft, Project, ProjectInput};
use crate::{categories, projects, system};

pub struct AppState {
    pub conn: Mutex<Connection>,
    pub db_path: PathBuf,
}

impl AppState {
    fn conn(&self) -> MutexGuard<'_, Connection> {
        // A poisoned lock only means an earlier command panicked; the connection is still usable.
        self.conn.lock().unwrap_or_else(|e| e.into_inner())
    }
}

type St<'a> = TauriState<'a, AppState>;

fn io(e: impl std::fmt::Display) -> AppError {
    AppError::Io(e.to_string())
}

#[tauri::command]
pub fn list_projects(state: St) -> AppResult<Vec<Project>> {
    projects::list(&state.conn())
}

#[tauri::command]
pub fn create_project(state: St, input: ProjectInput) -> AppResult<Project> {
    projects::create(&state.conn(), &input)
}

#[tauri::command]
pub fn update_project(state: St, id: i64, input: ProjectInput) -> AppResult<Project> {
    projects::update(&state.conn(), id, &input)
}

#[tauri::command]
pub fn delete_project(state: St, id: i64) -> AppResult<()> {
    projects::delete(&state.conn(), id)
}

#[tauri::command]
pub fn list_categories(state: St) -> AppResult<Vec<Category>> {
    categories::list(&state.conn())
}

#[tauri::command]
pub fn save_categories(
    state: St,
    drafts: Vec<CategoryDraft>,
    deleted: Vec<i64>,
) -> AppResult<Vec<Category>> {
    categories::save_all(&mut state.conn(), &drafts, &deleted)
}

#[tauri::command]
pub fn open_folder(app: AppHandle, path: String) -> AppResult<()> {
    system::ensure_dir_exists(&path)?;
    app.opener().open_path(path, None::<&str>).map_err(io)
}

#[tauri::command]
pub fn open_url(app: AppHandle, url: String) -> AppResult<()> {
    let url = system::normalize_url(&system::repo_web_url(&url))?;
    app.opener().open_url(url, None::<&str>).map_err(io)
}

#[tauri::command]
pub fn open_db_folder(app: AppHandle, state: St) -> AppResult<()> {
    app.opener().reveal_item_in_dir(&state.db_path).map_err(io)
}
