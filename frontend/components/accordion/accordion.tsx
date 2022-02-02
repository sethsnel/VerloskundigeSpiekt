import styles from './accordion.module.scss';

import { useState } from 'react';

interface AccordionProps {
  name: string;
  text: string;
}

const Accordion = (props: AccordionProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  let accordionClasses = styles.accordion;
  if (collapsed) {
    accordionClasses = `${styles.accordion} ${styles.collapsed}`;
  }

  return (
    <div className={accordionClasses}>
      <h2>
        <button onClick={() => setCollapsed(!collapsed)}>{props.name}</button>
      </h2>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: props.text }}
      ></div>
    </div>
  );
};

export default Accordion;
