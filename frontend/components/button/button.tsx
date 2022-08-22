import { ReactNode } from 'react'
import { IconContext } from 'react-icons'
import { FiEdit3 } from 'react-icons/fi'
import { IoSaveOutline } from 'react-icons/io5'
import { GrAddCircle } from 'react-icons/gr'
import { ImCancelCircle } from 'react-icons/im'
import { MdDelete } from 'react-icons/md'
import { AiOutlineLogout, AiOutlineLogin } from 'react-icons/ai'

import styles from './button.module.scss'

interface ButtonProps {
  children: ReactNode
  onClick?: Function
  icon?: 'edit' | 'save' | 'add' | 'delete' | 'cancel' | 'logout' | 'login'
}

const Button = ({ children, onClick, icon, ...rest }: ButtonProps) => {
  let iconType = undefined
  let warning = false

  if (icon === 'edit') {
    iconType = (<FiEdit3 />)
  }
  if (icon === 'save') {
    iconType = (<IoSaveOutline />)
  }
  if (icon === 'add') {
    iconType = (<GrAddCircle />)
  }
  if (icon === 'delete') {
    warning = true
    iconType = (<MdDelete />)
  }
  if (icon === 'cancel') {
    iconType = (<ImCancelCircle />)
  }
  if (icon === 'logout') {
    iconType = (<AiOutlineLogout />)
  }
  if (icon === 'login') {
    iconType = (<AiOutlineLogin />)
  }

  return (
    <button onClick={() => onClick && onClick()} className={`${styles.button} ${warning && styles.warning}`} {...rest}>
      <IconContext.Provider value={{ className: styles.iconColor }}>
        {iconType}
      </IconContext.Provider>
      {children}
    </button>
  )
}

export default Button
