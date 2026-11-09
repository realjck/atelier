use rusqlite::{Connection, params};

use crate::error::{AppError, AppResult};
use crate::models::{Category, CategoryDraft};

/// All categories, sorted by name (case-insensitive).
pub fn list(conn: &Connection) -> AppResult<Vec<Category>> {
    let mut stmt =
        conn.prepare("SELECT id, name, color FROM categories ORDER BY name COLLATE NOCASE")?;
    let rows = stmt.query_map([], |r| {
        Ok(Category {
            id: r.get(0)?,
            name: r.get(1)?,
            color: r.get(2)?,
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

/// Applies the staged edits of the Manage Categories panel in one transaction.
pub fn save_all(
    conn: &mut Connection,
    drafts: &[CategoryDraft],
    deleted: &[i64],
) -> AppResult<Vec<Category>> {
    let tx = conn.transaction()?;
    for id in deleted {
        tx.execute("DELETE FROM categories WHERE id = ?1", [id])?;
    }
    for draft in drafts {
        let (name, color) = validate(draft)?;
        match draft.id {
            Some(id) => tx.execute(
                "UPDATE categories SET name = ?1, color = ?2 WHERE id = ?3",
                params![name, color, id],
            )?,
            None => tx.execute(
                "INSERT INTO categories (name, color) VALUES (?1, ?2)",
                params![name, color],
            )?,
        };
    }
    tx.commit()?;
    list(conn)
}

fn validate(draft: &CategoryDraft) -> AppResult<(String, String)> {
    let name = draft.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("Category name is required".into()));
    }
    let color = draft.color.trim().to_lowercase();
    let is_hex = color.len() == 7
        && color.starts_with('#')
        && color[1..].chars().all(|c| c.is_ascii_hexdigit());
    if !is_hex {
        return Err(AppError::Validation(format!(
            "Invalid color: {}",
            draft.color
        )));
    }
    Ok((name.to_string(), color))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::error::AppError;
    use crate::models::CategoryDraft;

    fn draft(id: Option<i64>, name: &str, color: &str) -> CategoryDraft {
        CategoryDraft {
            id,
            name: name.into(),
            color: color.into(),
        }
    }

    #[test]
    fn save_all_inserts_updates_and_deletes() {
        let mut conn = db::open_in_memory().unwrap();
        let saved = save_all(
            &mut conn,
            &[draft(None, "Pro", "#2f7cf6"), draft(None, "Dev", "#8b5cf6")],
            &[],
        )
        .unwrap();
        let pro = saved.iter().find(|c| c.name == "Pro").unwrap().id;
        let dev = saved.iter().find(|c| c.name == "Dev").unwrap().id;

        let after = save_all(&mut conn, &[draft(Some(pro), "Work", "#2f7cf6")], &[dev]).unwrap();

        assert_eq!(after.len(), 1);
        assert_eq!(after[0].id, pro);
        assert_eq!(after[0].name, "Work");
        assert_eq!(after[0].color, "#2f7cf6");
    }

    #[test]
    fn save_all_rejects_blank_name_and_bad_color() {
        let mut conn = db::open_in_memory().unwrap();
        let blank = save_all(
            &mut conn,
            &[draft(None, "Ok", "#000000"), draft(None, "  ", "#2f7cf6")],
            &[],
        );
        assert!(matches!(blank, Err(AppError::Validation(_))));
        let bad = save_all(&mut conn, &[draft(None, "Pro", "blue")], &[]);
        assert!(matches!(bad, Err(AppError::Validation(_))));
        assert!(list(&conn).unwrap().is_empty());
    }

    #[test]
    fn deleting_category_nulls_projects() {
        let mut conn = db::open_in_memory().unwrap();
        let id = save_all(&mut conn, &[draft(None, "Pro", "#2f7cf6")], &[]).unwrap()[0].id;
        conn.execute(
            "INSERT INTO projects (name, category_id, created, state) VALUES ('P', ?1, '2025-04-12', 'draft')",
            [id],
        )
        .unwrap();

        save_all(&mut conn, &[], &[id]).unwrap();

        let category: Option<i64> = conn
            .query_row("SELECT category_id FROM projects", [], |r| r.get(0))
            .unwrap();
        assert_eq!(category, None);
    }

    #[test]
    fn migrations_are_idempotent() {
        let path = std::env::temp_dir().join(format!("atelier-test-{}.db", std::process::id()));
        let _ = std::fs::remove_file(&path);
        db::open(&path).unwrap();
        let conn = db::open(&path).unwrap();
        let version: i64 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(version, db::MIGRATIONS.len() as i64);
        drop(conn);
        let _ = std::fs::remove_file(&path);
    }
}
