export default interface SubTopic {
  id?: string
  name: string
  text: string
}

export const mockSubTopics: SubTopic[] = [
  {
    id: '1',
    name: 'Geboorteplan',
    text: "<p>In een geboorteplan beschrijf je jouw wensen rondom de bevalling. Het is bedoeld voor jezelf, je partner, je verloskundige of andere zorgverleners. Door het geboorteplan laat je zien wat voor jou belangrijk is. Degene die je bevalling begeleidt kan hier zoveel mogelijk rekening mee houden.</p><h2>Wat is een geboorteplan?</h2><p>Een geboorteplan is een beknopt document dat je digitaal of op papier kunt invullen. De lengte varieert tussen een paar regels tot maximaal twee A4'tjes. Zorgverleners moeten het namelijk snel kunnen lezen.</p>"
  },
  {
    id: '2',
    name: 'Over de verloskundige',
    text: "<h2>Kopje</h2><p>Verloskundigen in Nederland zijn ervoor opgeleid om zwangerschap en bevalling te behandelen als een normaal en natuurlijk iets. Zij zorgen ervoor dat er tijdens je zwangerschap en bevalling geen onnodige medische ingrepen plaats vinden. Dat geldt voor alle verloskundigen: of ze nu werken in een verloskundigenpraktijk, een geboortecentrum of in het ziekenhuis.</p>"
  }
]