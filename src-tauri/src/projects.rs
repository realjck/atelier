use chrono::NaiveDate;
use rusqlite::{Connection, Row, params};

use crate::error::{AppError, AppResult};
use crate::models::{Project, ProjectInput};

const COLUMNS: &str = "id, name, category_id, created, state, local_path, repo_url, prod_url";

/// All projects, newest first.
pub fn list(conn: &Connection) -> AppResult<Vec<Project>> {
    let sql = format!("SELECT {COLUMNS} FROM projects ORDER BY created DESC, id DESC");
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], from_row)?;
    Ok(rows.collect::<Result<_, _>>()?)
}

pub fn create(conn: &Connection, input: &ProjectInput) -> AppResult<Project> {
    let p = clean(input)?;
    conn.execute(
        "INSERT INTO projects (name, category_id, created, state, local_path, repo_url, prod_url)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            p.name,
            p.category_id,
            p.created,
            p.state.as_str(),
            p.local_path,
            p.repo_url,
            p.prod_url
        ],
    )?;
    get(conn, conn.last_insert_rowid())
}

pub fn update(conn: &Connection, id: i64, input: &ProjectInput) -> AppResult<Project> {
    let p = clean(input)?;
    let changed = conn.execute(
        "UPDATE projects SET name = ?1, category_id = ?2, created = ?3, state = ?4,
         local_path = ?5, repo_url = ?6, prod_url = ?7 WHERE id = ?8",
        params![
            p.name,
            p.category_id,
            p.created,
            p.state.as_str(),
            p.local_path,
            p.repo_url,
            p.prod_url,
            id
        ],
    )?;
    if changed == 0 {
        return Err(not_found(id));
    }
    get(conn, id)
}

pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
    if conn.execute("DELETE FROM projects WHERE id = ?1", [id])? == 0 {
        return Err(not_found(id));
    }
    Ok(())
}

fn get(conn: &Connection, id: i64) -> AppResult<Project> {
    let sql = format!("SELECT {COLUMNS} FROM projects WHERE id = ?1");
    Ok(conn.query_row(&sql, [id], from_row)?)
}

fn not_found(id: i64) -> AppError {
    AppError::NotFound(format!("Project {id} not found"))
}

fn from_row(r: &Row) -> rusqlite::Result<Project> {
    Ok(Project {
        id: r.get(0)?,
        name: r.get(1)?,
        category_id: r.get(2)?,
        created: r.get(3)?,
        state: r.get(4)?,
        local_path: r.get(5)?,
        repo_url: r.get(6)?,
        prod_url: r.get(7)?,
    })
}

/// Validates input and normalizes blank optional fields to None.
fn clean(input: &ProjectInput) -> AppResult<ProjectInput> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("Project name is required".into()));
    }
    let created = input.created.trim();
    if NaiveDate::parse_from_str(created, "%Y-%m-%d").is_err() {
        return Err(AppError::Validation(format!(
            "Invalid date: {}",
            input.created
        )));
    }
    Ok(ProjectInput {
        name: name.to_string(),
        category_id: input.category_id,
        created: created.to_string(),
        state: input.state,
        local_path: optional(&input.local_path),
        repo_url: optional(&input.repo_url),
        prod_url: optional(&input.prod_url),
    })
}

fn optional(value: &Option<String>) -> Option<String> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::error::AppError;
    use crate::models::{ProjectInput, State};

    fn input(name: &str, created: &str) -> ProjectInput {
        ProjectInput {
            name: name.into(),
            category_id: None,
            created: created.into(),
            state: State::Draft,
            local_path: None,
            repo_url: None,
            prod_url: None,
        }
    }

    #[test]
    fn create_then_list_roundtrip() {
        let conn = db::open_in_memory().unwrap();
        let mut full = input("Portfolio site redesign", "2025-04-12");
        full.state = State::InProgress;
        full.local_path = Some(r"E:\projects\portfolio".into());
        full.repo_url = Some("https://github.com/me/portfolio".into());
        full.prod_url = Some("https://example.com".into());

        let created = create(&conn, &full).unwrap();
        let all = list(&conn).unwrap();

        assert_eq!(all, vec![created.clone()]);
        assert_eq!(created.state, State::InProgress);
        assert_eq!(
            created.local_path.as_deref(),
            Some(r"E:\projects\portfolio")
        );
        assert_eq!(created.prod_url.as_deref(), Some("https://example.com"));
    }

    #[test]
    fn blank_optional_fields_become_null() {
        let conn = db::open_in_memory().unwrap();
        let mut p = input("P", "2025-04-12");
        p.local_path = Some("   ".into());
        p.prod_url = Some("".into());
        p.repo_url = Some("  https://gitlab.com/x  ".into());

        let created = create(&conn, &p).unwrap();

        assert_eq!(created.local_path, None);
        assert_eq!(created.prod_url, None);
        assert_eq!(created.repo_url.as_deref(), Some("https://gitlab.com/x"));
    }

    #[test]
    fn rejects_blank_name_and_bad_date() {
        let conn = db::open_in_memory().unwrap();
        assert!(matches!(
            create(&conn, &input("  ", "2025-04-12")),
            Err(AppError::Validation(_))
        ));
        assert!(matches!(
            create(&conn, &input("P", "2025-13-40")),
            Err(AppError::Validation(_))
        ));
    }

    #[test]
    fn update_and_delete_missing_id_is_not_found() {
        let conn = db::open_in_memory().unwrap();
        assert!(matches!(
            update(&conn, 999, &input("P", "2025-04-12")),
            Err(AppError::NotFound(_))
        ));
        assert!(matches!(delete(&conn, 999), Err(AppError::NotFound(_))));
    }

    #[test]
    fn update_changes_fields_and_delete_removes() {
        let conn = db::open_in_memory().unwrap();
        let p = create(&conn, &input("Old", "2025-04-12")).unwrap();
        let mut changed = input("New", "2025-04-13");
        changed.state = State::Archived;

        let updated = update(&conn, p.id, &changed).unwrap();
        assert_eq!(updated.name, "New");
        assert_eq!(updated.state, State::Archived);

        delete(&conn, p.id).unwrap();
        assert!(list(&conn).unwrap().is_empty());
    }

    #[test]
    fn list_orders_newest_first() {
        let conn = db::open_in_memory().unwrap();
        create(&conn, &input("Old", "2025-03-28")).unwrap();
        create(&conn, &input("New", "2025-04-12")).unwrap();
        create(&conn, &input("Mid", "2025-04-05")).unwrap();

        let names: Vec<String> = list(&conn).unwrap().into_iter().map(|p| p.name).collect();
        assert_eq!(names, ["New", "Mid", "Old"]);
    }
}
