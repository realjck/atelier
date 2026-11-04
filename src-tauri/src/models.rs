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
