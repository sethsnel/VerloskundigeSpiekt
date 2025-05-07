type Channel = keyof typeof channelLabels

const channelLabels = {
  VerloskundigeSpiekt: {
    websiteTitle: 'Verloskundige Spiekt',
    websiteDescription: 'Eerste hulp bij verloskudige kennis',
    articlesTitle: 'Spiekbriefjes',
    createNote: "maak spiekbriefje",
    initialArticleTitle: "A - Nieuw spiekbriefje"
  },
  Recepten: {
    websiteTitle: 'Recepten Snel de Haas',
    websiteDescription: 'Het online receptenboek',
    articlesTitle: 'Recepten',
    createNote: "maak recept",
    initialArticleTitle: "A - Nieuw Recept"
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
