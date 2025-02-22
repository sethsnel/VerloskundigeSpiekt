import styles from '../styles/Home.module.scss'

export default function Home() {
  return (
    <>
      <div className={styles.main}>
        <h1 className={styles.title}>Verloskundige Spiekt</h1>
        <p>Je kent het vast: van die kleine dingen die je iedere keer weer even op moet zoeken. Dat wordt een stuk makkelijker met Verloskundige Spiekt! Geen chaotische notitieboekjes meer, maar een handige website met duidelijke mobiele weergave. Maak een account aan of log in met je Google account om spiekbriefjes toe te voegen of sub-onderwerpen toe te voegen aan bestaande spiekbriefjes. Ook handig voor VIO’s als stageboekje!</p>
        <p>Disclaimer: Verloskundige Spiekt is niet aansprakelijk voor gevolgen door het gebruik van onze spiekbriefjes.</p>
        <p>
          Voor vragen of opmerkingen over de inhoud: <a href="mailto:inhoud@verloskundigespiekt.nl">inhoud@verloskundigespiekt.nl</a><br />
          Voor vragen of opmerkingen over de website functionaliteiten: <a href="mailto:development@verloskundigespiekt.nl">development@verloskundigespiekt.nl</a>\
        </p>
      </div>
    </>
  )
}
