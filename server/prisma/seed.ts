import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const games = [
    { name: 'Catan', externalId: '13', apiSource: 'seed', minPlayers: 3, maxPlayers: 4, averageDuration: 90 },
    { name: 'Azul', externalId: '230802', apiSource: 'seed', minPlayers: 2, maxPlayers: 4, averageDuration: 45 },
    { name: '7 Wonders', externalId: '68448', apiSource: 'seed', minPlayers: 3, maxPlayers: 7, averageDuration: 45 },
    { name: 'Ticket to Ride', externalId: '9209', apiSource: 'seed', minPlayers: 2, maxPlayers: 5, averageDuration: 60 },
    { name: 'Splendor', externalId: '148228', apiSource: 'seed', minPlayers: 2, maxPlayers: 4, averageDuration: 30 },
    { name: 'Terraforming Mars', externalId: '167791', apiSource: 'seed', minPlayers: 1, maxPlayers: 5, averageDuration: 120 }
  ]

  for (const g of games) {
    await prisma.game.upsert({
      where: { externalId: g.externalId! },
      create: g,
      update: {
        name: g.name,
        minPlayers: g.minPlayers,
        maxPlayers: g.maxPlayers,
        averageDuration: g.averageDuration
      }
    })
  }

  console.info('Seed complete: games inserted/updated')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

