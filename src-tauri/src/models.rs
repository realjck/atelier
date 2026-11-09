use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

/// Lifecycle state of a project. Fixed list, stored as a snake_case slug.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum State {
    Idea,
    Draft,
    InProgress,
    OnHold,
    Completed,
    Archived,
}

impl State {
    pub fn as_str(self) -> &'static str {
        match self {
            State::Idea => "idea",
            State::Draft => "draft",
            State::InProgress => "in_progress",
            State::OnHold => "on_hold",
            State::Completed => "completed",
            State::Archived => "archived",
        }
    }

    pub fn parse(s: &str) -> AppResult<State> {
        match s {
            "idea" => Ok(State::Idea),
            "draft" => Ok(State::Draft),
            "in_progress" => Ok(State::InProgress),
            "on_hold" => Ok(State::OnHold),
            "completed" => Ok(State::Completed),
            "archived" => Ok(State::Archived),
            other => Err(AppError::Validation(format!("Unknown state: {other}"))),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub color: String,
}

/// A category as edited in the Manage Categories panel; `id` is None for new ones.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDraft {
    pub id: Option<i64>,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub category_id: Option<i64>,
    /// Creation date as `YYYY-MM-DD`.
    pub created: String,
    pub state: State,
    pub local_path: Option<String>,
    pub repo_url: Option<String>,
    pub prod_url: Option<String>,
    /// 1-based rank, unique and contiguous across all projects; changed only by reordering.
    pub priority: i64,
}

/// Fields of a project as submitted by the UI (no id).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInput {
    pub name: String,
    pub category_id: Option<i64>,
    pub created: String,
    pub state: State,
    pub local_path: Option<String>,
    pub repo_url: Option<String>,
    pub prod_url: Option<String>,
}

impl rusqlite::types::FromSql for State {
    fn column_result(value: rusqlite::types::ValueRef<'_>) -> rusqlite::types::FromSqlResult<Self> {
        let text = value.as_str()?;
        State::parse(text).map_err(|e| rusqlite::types::FromSqlError::Other(Box::new(e)))
    }
}
