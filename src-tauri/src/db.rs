use std::path::Path;

use rusqlite::Connection;

use crate::error::AppResult;

/// Ordered schema migrations; index + 1 is the `user_version` after applying it.
pub(crate) const MIGRATIONS: &[&str] = &[
    "
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      color TEXT NOT NULL
    );
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created TEXT NOT NULL,
      state TEXT NOT NULL,
      local_path TEXT,
      repo_url TEXT,
      prod_url TEXT
    );
",
    // Priorities start in the former default order: newest first.
    "
    ALTER TABLE projects ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
    UPDATE projects SET priority = 1 + (
      SELECT COUNT(*) FROM projects AS o
      WHERE o.created > projects.created OR (o.created = projects.created AND o.id > projects.id)
    );
",
];

pub fn open(path: &Path) -> AppResult<Connection> {
    prepare(Connection::open(path)?)
}

#[cfg(test)]
pub fn open_in_memory() -> AppResult<Connection> {
    prepare(Connection::open_in_memory()?)
}

fn prepare(mut conn: Connection) -> AppResult<Connection> {
    // Foreign keys are off by default in SQLite; ON DELETE SET NULL relies on them.
    conn.pragma_update(None, "foreign_keys", true)?;
    migrate(&mut conn)?;
    Ok(conn)
}

fn migrate(conn: &mut Connection) -> AppResult<()> {
    let current: i64 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    for (index, sql) in MIGRATIONS.iter().enumerate().skip(current as usize) {
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", index as i64 + 1)?;
        tx.commit()?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn priority_migration_numbers_existing_projects_newest_first() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(MIGRATIONS[0]).unwrap();
        conn.pragma_update(None, "user_version", 1).unwrap();
        conn.execute_batch(
            "INSERT INTO projects (id, name, created, state) VALUES
               (1, 'Old', '2025-01-01', 'draft'),
               (2, 'New', '2025-06-01', 'draft'),
               (3, 'Same day, lower id', '2025-03-01', 'draft'),
               (4, 'Same day, higher id', '2025-03-01', 'draft');",
        )
        .unwrap();

        migrate(&mut conn).unwrap();

        let mut stmt = conn
            .prepare("SELECT id FROM projects ORDER BY priority")
            .unwrap();
        let ids: Vec<i64> = stmt
            .query_map([], |r| r.get(0))
            .unwrap()
            .map(Result::unwrap)
            .collect();
        assert_eq!(ids, [2, 4, 3, 1]);
    }
}
