// Points: 10 per report, 2 per "I saw this too", and 50 + 5 x severity per verified cleanup.
export function pointsFor(userId, reports) {
  let pts = 0
  for (const r of reports) {
    if (r.createdBy === userId) pts += 10
    if (r.seenBy?.includes(userId)) pts += 2
    if (r.status === 'cleaned' && r.cleanup?.by === userId) pts += 50 + (r.ai?.severity || 0) * 5
  }
  return pts
}
