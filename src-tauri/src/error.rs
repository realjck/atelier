use serde::{Serialize, Serializer};

/// Error returned by every store function and Tauri command.
/// Serialized as its message so the UI can display it directly.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    Validation(String),
    #[error("{0}")]
    NotFound(String),
    #[error("Database error: {0}")]
    Db(#[from] rusqlite::Error),
    #[error("{0}")]
    Io(String),
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
