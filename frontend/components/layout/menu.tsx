import styles from './menu.module.scss';

const Menu = () => {
  return (
    <nav className={styles.nav}>
      <h2>Onderwerpen</h2>
      <div>
        <a href='#'>Geboorte zorg</a>
      </div>
      <div>
        <a href='#'>Protocollen</a>
      </div>
      <div>
        <a href='#'>Verloskunde</a>
      </div>
    </nav>
  );
};

export default Menu;
