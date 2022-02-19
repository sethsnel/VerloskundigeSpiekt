import styles from './icon.module.scss'

import { IconContext } from 'react-icons'
import { IconType } from 'react-icons/lib'

interface IconProps {
  icon: IconType
}

const Icon = (props: IconProps) => {
  return (
    <>
      <IconContext.Provider value={{ className: styles.iconColor }}>
        <props.icon />
      </IconContext.Provider>
    </>
  )
}

export default Icon
