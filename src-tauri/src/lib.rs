mod categories;
mod commands;
mod db;
mod error;
mod models;
mod projects;
mod system;

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::Manager;

use commands::AppState;

const DB_FILE: &str = "atelier.db";
/// Debug builds work on a copy so development never migrates or edits the real data.
#[cfg(debug_assertions)]
const DEV_DB_FILE: &str = "atelier-dev.db";

#[cfg(not(debug_assertions))]
fn db_path(dir: &Path) -> std::io::Result<PathBuf> {
    Ok(dir.join(DB_FILE))
}

/// Seeds the dev database from the real one on first launch.
#[cfg(debug_assertions)]
fn db_path(dir: &Path) -> std::io::Result<PathBuf> {
    let dev = dir.join(DEV_DB_FILE);
    let real = dir.join(DB_FILE);
    if !dev.exists() && real.exists() {
        std::fs::copy(&real, &dev)?;
    }
    Ok(dev)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let db_path = db_path(&dir)?;
            let conn = db::open(&db_path)?;
            app.manage(AppState {
                conn: Mutex::new(conn),
                db_path,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_projects,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::reorder_projects,
            commands::list_categories,
            commands::save_categories,
            commands::open_folder,
            commands::open_url,
            commands::open_db_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
