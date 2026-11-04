export type RepoProvider = "github" | "gitlab" | "git";

/** Provider icon to show for a repository URL (HTTPS or SSH form). */
export function detectProvider(url: string | null): RepoProvider | null {
  const value = url?.trim().toLowerCase();
  if (!value) return null;
  if (value.includes("github.com")) return "github";
  if (value.includes("gitlab")) return "gitlab";
  return "git";
}
