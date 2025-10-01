type Channel = keyof typeof channelLabels

const channelLabels = {
  VerloskundigeSpiekt: {
    websiteTitle: 'Verloskundige Spiekt',
    websiteDescription: 'Het ABC boekje voor verloskundigen',
    articlesTitle: 'Spiekbriefjes',
    createNote: "Maak spiekbriefje",
    initialArticleTitle: "A - Nieuw spiekbriefje"
  },
  Recepten: {
    websiteTitle: 'Recepten Snel de Haas',
    websiteDescription: 'Het receptenboek',
    articlesTitle: 'Recepten',
    createNote: "Maak recept",
    initialArticleTitle: "A - Nieuw recept"
  },
}

export function getChannelLabels() {
  const channel = getChannel()
  return channelLabels[channel]
}

function getChannel(): Channel {
  if (process.env.NEXT_PUBLIC_CHANNEL !== 'Recepten' && process.env.NEXT_PUBLIC_CHANNEL !== 'VerloskundigeSpiekt') {
    throw new Error(`Invalid channel: ${process.env.NEXT_PUBLIC_CHANNEL}`)
  }

  return process.env.NEXT_PUBLIC_CHANNEL
}
