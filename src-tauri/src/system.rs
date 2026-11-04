use std::path::Path;

use crate::error::{AppError, AppResult};

/// Makes a user-typed URL openable: adds `https://` when no scheme is given,
/// and only accepts http(s) so nothing else is handed to the OS.
pub fn normalize_url(raw: &str) -> AppResult<String> {
    let url = raw.trim();
    let unsupported = || AppError::Validation(format!("Unsupported URL: {url}"));
    if url.is_empty() {
        return Err(unsupported());
    }
    match scheme(url) {
        Some(s) if s.eq_ignore_ascii_case("http") || s.eq_ignore_ascii_case("https") => {
            Ok(url.to_string())
        }
        Some(_) => Err(unsupported()),
        None => Ok(format!("https://{url}")),
    }
}

/// Scheme of `url`, if it has one. `host:8080` is a port, not a scheme.
fn scheme(url: &str) -> Option<&str> {
    let (head, rest) = url.split_once(':')?;
    let valid = head.chars().next()?.is_ascii_alphabetic()
        && head
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "+-.".contains(c));
    let is_port = rest.chars().next().is_some_and(|c| c.is_ascii_digit());
    (valid && !is_port).then_some(head)
}

/// Turns SSH clone addresses (`git@host:path.git`, `ssh://git@host/path`) into the
/// repository's web page; anything else is returned trimmed and unchanged.
pub fn repo_web_url(raw: &str) -> String {
    let url = raw.trim();
    let (host, path) = if let Some(rest) = url.strip_prefix("ssh://") {
        let rest = rest.split_once('@').map_or(rest, |(_, r)| r);
        let (authority, path) = rest.split_once('/').unwrap_or((rest, ""));
        (authority.split(':').next().unwrap_or(authority), path)
    } else {
        match url.split_once('@') {
            Some((_, rest)) if !url.contains("://") => match rest.split_once(':') {
                Some(parts) => parts,
                None => return url.to_string(),
            },
            _ => return url.to_string(),
        }
    };
    let path = path.trim_start_matches('/');
    let path = path.strip_suffix(".git").unwrap_or(path);
    format!("https://{host}/{path}")
}

pub fn ensure_dir_exists(path: &str) -> AppResult<()> {
    if Path::new(path).is_dir() {
        Ok(())
    } else {
        Err(AppError::Io(format!("Folder not found: {path}")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::AppError;

    #[test]
    fn repo_web_url_converts_ssh_forms() {
        assert_eq!(
            repo_web_url("git@gitlab.com:a/b.git"),
            "https://gitlab.com/a/b"
        );
        assert_eq!(
            repo_web_url(" git@github.com:me/x "),
            "https://github.com/me/x"
        );
        assert_eq!(
            repo_web_url("ssh://git@host.io:2222/a/b.git"),
            "https://host.io/a/b"
        );
        assert_eq!(
            repo_web_url("https://github.com/a/b"),
            "https://github.com/a/b"
        );
        assert_eq!(repo_web_url("example.com:8080/x"), "example.com:8080/x");
    }

    #[test]
    fn normalize_url_adds_https() {
        assert_eq!(normalize_url("example.com").unwrap(), "https://example.com");
        assert_eq!(normalize_url(" http://a.b ").unwrap(), "http://a.b");
        assert_eq!(normalize_url("HTTPS://a.b/x").unwrap(), "HTTPS://a.b/x");
    }

    #[test]
    fn normalize_url_rejects_other_schemes() {
        for raw in ["file:///C:/x", "javascript:alert(1)", "  "] {
            assert!(
                matches!(normalize_url(raw), Err(AppError::Validation(_))),
                "{raw}"
            );
        }
    }

    #[test]
    fn ensure_dir_exists_errors_on_missing() {
        let missing = std::env::temp_dir().join("atelier-definitely-missing-dir");
        match ensure_dir_exists(missing.to_str().unwrap()) {
            Err(AppError::Io(msg)) => assert!(msg.contains("Folder not found")),
            other => panic!("unexpected: {other:?}"),
        }
        assert!(ensure_dir_exists(std::env::temp_dir().to_str().unwrap()).is_ok());
    }
}
