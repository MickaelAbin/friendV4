import { prisma } from "../utils/prisma.js"

export class StatsService {
  static async getHistoryStats() {
    // Top tacticians based on total score or simply rank 1 games
    // For now, calculating based on sum of score in results
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        results: {
          select: { score: true }
        }
      }
    });

    const rankedUsers = users.map(user => {
      const totalScore = user.results.reduce((sum, r) => sum + r.score, 0);
      return {
        id: user.id,
        name: user.displayName,
        points: `${totalScore} pts`, // Formatting for UI
        scoreNum: totalScore
      };
    }).sort((a, b) => b.scoreNum - a.scoreNum).slice(0, 3);

    // Rank assignment
    const topUsers = rankedUsers.map((u, i) => ({
      ...u,
      rank: i + 1,
      // Fallback avatars like in UI if missing
      avatar: i === 0 
        ? "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80"
        : i === 1 
          ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    }));

    // Recent History (FINISHED sessions)
    const recentSessions = await prisma.sessionGame.findMany({
      where: {
        session: { status: 'FINISHED' }
      },
      orderBy: { session: { startDatetime: 'desc' } },
      take: 5,
      include: {
        game: true,
        session: { select: { startDatetime: true, participations: { select: { userId: true } } } },
        results: { select: { score: true, playerRank: true, player: { select: { displayName: true } } } }
      }
    });

    const recentHistory = recentSessions.map(sg => {
      // Best player
      const winner = sg.results.find(r => r.playerRank === 1)?.player?.displayName || "Unknown";
      return {
        id: sg.id,
        game: sg.game.name,
        date: sg.session.startDatetime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        players: sg.session.participations.length,
        cover: sg.game.imageUrl || "https://images.unsplash.com/photo-1610890716171-6b1bb98ffaed?auto=format&fit=crop&w=100&q=80",
        winner,
        // Mocked winner avatar, could use gravatar or deterministic
        winnerAvatar: "https://ui-avatars.com/api/?name=" + winner
      };
    });

    // Session Summary overall
    const totalFinished = await prisma.session.count({ where: { status: 'FINISHED' }});
    // For win ratio, hard to compute globally. Let's provide a mock metric for UI.
    // Hours played based on average duration
    const allGames = await prisma.sessionGame.findMany({
      where: { session: { status: 'FINISHED' } },
      include: { game: { select: { averageDuration: true } } }
    });
    
    const totalMinutes = allGames.reduce((acc, sg) => acc + (sg.game.averageDuration || 60), 0);
    const totalHours = Math.round(totalMinutes / 60);

    const sessionSummary = {
      totalSessions: totalFinished,
      winRatio: "64%", // Placedholder since global win ratio implies single user
      hoursPlayed: `${totalHours}h`,
      quote: `"Felix is on a 5-game winning streak. Someone needs to stop him!"`
    };

    // Group Achievements (Mocked for now with dynamic data could be added later)
    const achievements = [
      { id: 1, title: "NIGHT OWLS", desc: "Played past midnight 10 times", icon: "🎖️", locked: false },
      { id: 2, title: "BIG TABLE", desc: `8+ players in a single session`, icon: "👥", locked: false },
      { id: 3, title: "GLOBETROTTER", desc: "Play 5 different types of games", icon: "🔒", locked: true },
      { id: 4, title: "MASTER MIND", desc: "Win without losing a single resource", icon: "🔒", locked: true }
    ];

    return {
      topUsers,
      recentHistory,
      sessionSummary,
      achievements
    };
  }
}
