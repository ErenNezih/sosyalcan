/**
 * Shared archive/restore helpers for soft delete.
 * Standard: archived_at (ISO), archived_by (user_id), is_deleted (boolean).
 */

export function buildArchiveFilter(archivedParam: string | null): { filterArchived: boolean; archivedOnly: boolean } {
  if (archivedParam === "true") return { filterArchived: false, archivedOnly: true };
  if (archivedParam === "all") return { filterArchived: false, archivedOnly: false };
  return { filterArchived: true, archivedOnly: false };
}

export const ARCHIVE_UPDATE = {
  archived_at: (): string => new Date().toISOString(),
  archived_by: (userId: string): string => userId,
  is_deleted: true,
};

export const RESTORE_UPDATE = {
  archived_at: "",
  archived_by: "",
  is_deleted: false,
};
