export function compareTaskGroups(
  a: { displayOrder?: number },
  b: { displayOrder?: number },
): number {
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
}

export function moveTaskGroup<T extends { id: string | number }>(groups: T[], id: string | number, position: number): T[] {
  const from = groups.findIndex((g) => g.id === id);
  if (from < 0 || position < 0 || position >= groups.length) return groups;
  const reordered = [...groups];
  const [group] = reordered.splice(from, 1);
  reordered.splice(position, 0, group);
  return reordered;
}
