export const queryKeys = {
  sessions: ['sessions'] as const,
  session: (id: number) => ['session', id] as const,
  games: ['games'] as const
}

