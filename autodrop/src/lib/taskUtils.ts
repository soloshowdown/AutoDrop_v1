export function normalizeTaskTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function taskTitlesMatch(a: string, b: string): boolean {
  return normalizeTaskTitle(a) === normalizeTaskTitle(b);
}

export function resolveAssigneeIdFromName(name: string | undefined, members: Array<any>): string | undefined {
  if (!name || !members?.length) return undefined;

  const normalizedTarget = name.trim().toLowerCase();
  const candidates = members.map((member) => {
    const user = member.users || {};
    const title = String(user.name || user.email || "").trim().toLowerCase();
    return {
      userId: user.id || member.user_id,
      name: title,
      email: String(user.email || "").trim().toLowerCase(),
    };
  });

  const exactMatch = candidates.find((candidate) => candidate.name === normalizedTarget || candidate.email === normalizedTarget);
  if (exactMatch) return exactMatch.userId;

  const partialMatch = candidates.find((candidate) => candidate.name && normalizedTarget.includes(candidate.name));
  if (partialMatch) return partialMatch.userId;

  return undefined;
}
