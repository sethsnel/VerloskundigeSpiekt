import styles from '../styles/Home.module.scss';

import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';

import { Accordion } from '../components/accordion';

const Home: NextPage = () => {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  let accordionClasses = styles.accordion;
  if (collapsed) {
    accordionClasses = `${styles.accordion} ${styles.collapsed}`;
  }

  return (
    <div>
      <Head>
        <title className={styles.title}>Verloskundige spiekt</title>
        <meta
          name='description'
          content='Eeerste hulp bij verloskudige kennis'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <h1 className={styles.title}>Verloskundige spiekt</h1>

      <main className={styles.main}>
        <div className={styles.grid}>
          <Accordion
            name='Geboorteplan'
            text={`<p>
                In een geboorteplan beschrijf je jouw wensen rondom de
                bevalling. Het is bedoeld voor jezelf, je partner, je
                verloskundige of andere zorgverleners. Door het geboorteplan
                laat je zien wat voor jou belangrijk is. Degene die je bevalling
                begeleidt kan hier zoveel mogelijk rekening mee houden.
              </p>
              <h2>Wat is een geboorteplan?</h2>
              <p>
                Een geboorteplan is een beknopt document dat je digitaal of op
                papier kunt invullen. De lengte varieert tussen een paar regels
                tot maximaal twee A4'tjes. Zorgverleners moeten het namelijk
                snel kunnen lezen.
              </p>`}
          />
          <Accordion
            name='Over de verloskundige'
            text={`<p>
			De verloskundige begeleidt je vóór, tijdens en na je
			zwangerschap. Ze adviseert en ondersteunt je tijdens deze
			belangrijke periode. Zij werkt aan de beste zorg voor jou en je
			baby.
		  </p>
		  <br />
		  <p>
			In Nederland hebben we een uniek verloskundig systeem: we gaan
			uit van het natuurlijke proces van zwangerschap en geboorte,
			vrouwen kunnen (in principe) zelf kiezen waar ze bevallen en
			verloskundigen werken zelfstandig.
		  </p>
		  <h2>Kopje</h2>
		  <p>
			Verloskundigen in Nederland zijn ervoor opgeleid om zwangerschap
			en bevalling te behandelen als een normaal en natuurlijk iets.
			Zij zorgen ervoor dat er tijdens je zwangerschap en bevalling
			geen onnodige medische ingrepen plaats vinden. Dat geldt voor
			alle verloskundigen: of ze nu werken in een
			verloskundigenpraktijk, een geboortecentrum of in het
			ziekenhuis.
		  </p>`}
          />
        </div>
      </main>
    </div>
  );
};

export default Home;
