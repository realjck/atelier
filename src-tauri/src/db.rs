use std::path::Path;

use rusqlite::Connection;

use crate::error::AppResult;

/// Ordered schema migrations; index + 1 is the `user_version` after applying it.
const MIGRATIONS: &[&str] = &["
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
"];

pub fn open(path: &Path) -> AppResult<Connection> {
    prepare(Connection::open(path)?)
}

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
