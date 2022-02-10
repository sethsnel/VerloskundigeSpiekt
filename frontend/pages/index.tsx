import type { NextPage } from 'next'
import Head from 'next/head'

import { DefaultLayout, DefaultLayoutProps } from '../components/layout'
import fetchLayoutProps from '../lib/shared/fetchLayoutProps'

import styles from '../styles/Home.module.scss'

interface HomePageProps {
  layoutProps: DefaultLayoutProps
}

const Home: NextPage<HomePageProps> = ({ layoutProps }: HomePageProps) => {
  return (
    <div>
      <Head>
        <title className={styles.title}>Verloskundige Spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <DefaultLayout {...layoutProps}>
        <div className={styles.main}>
          <h1 className={styles.title}>Verloskundige Spiekt</h1>
          <p>Je kent het vast: van die kleine dingen die je iedere keer weer even op moet zoeken. Dat wordt een stuk makkelijker met Verloskundige Spiekt! Geen chaotische notitieboekjes meer, maar een handige website met duidelijke mobiele weergave. Maak een account aan of log in met je Google account om spiekbriefjes toe te voegen of sub-onderwerpen toe te voegen aan bestaande spiekbriefjes. Ook handig voor VIO’s als stageboekje!</p>

          <p>Disclaimer: Verloskundige Spiekt is niet aansprakelijk voor gevolgen door het gebruik van onze spiekbriefjes.</p>
          <p>Voor vragen of opmerkingen over de inhoud: <a href="mailto:inhoud@verloskundigespiekt.nl">inhoud@verloskundigespiekt.nl</a><br />
            Voor vragen of opmerkingen over de website functionaliteiten: <a href="mailto:development@verloskundigespiekt.nl">development@verloskundigespiekt.nl</a></p>

          <p>Onderwerpen of sub-onderwerpen die je hier toevoegt, zijn alleen zichtbaar voor jezelf als je ingelogd bent</p>
        </div>
      </DefaultLayout>
    </div>
  )
}

export async function getStaticProps() {
  const layoutProps = await fetchLayoutProps()

  return {
    props: {
      layoutProps
    },
    revalidate: 60 * 10
  }
}

export default Home
