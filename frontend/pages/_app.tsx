import '../styles/_colors.scss';
import '../styles/globals.scss';
import styles from '../styles/App.module.scss';

import type { AppProps } from 'next/app';
import { Content, Menu } from '../components/layout';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={styles.container}>
      <Menu />
      <Content>
        <Component {...pageProps} />
      </Content>
    </div>
  );
}

export default MyApp;
