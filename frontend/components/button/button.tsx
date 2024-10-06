import { HTMLProps, ReactNode } from 'react'
import { IconContext } from 'react-icons'
import { FiEdit3 } from 'react-icons/fi'
import { IoSaveOutline } from 'react-icons/io5'
import { GrAddCircle } from 'react-icons/gr'
import { ImCancelCircle } from 'react-icons/im'
import { MdDelete } from 'react-icons/md'
import { AiOutlineLogout, AiOutlineLogin } from 'react-icons/ai'

import styles from './button.module.scss'

interface ButtonProps extends HTMLProps<HTMLButtonElement> {
  children: ReactNode
  icon?: 'edit' | 'save' | 'add' | 'delete' | 'cancel' | 'logout' | 'login'
}

const Button = ({ children, icon, type, className, ...rest }: ButtonProps) => {
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
    <button type="button" className={`${className?.includes('btn') ? '' : styles.button} ${warning && styles.warning} ${className}`} {...rest}>
      <IconContext.Provider value={{ className: warning ? styles.iconWarningColor : styles.iconColor }}>
        {iconType}
      </IconContext.Provider>
      {children}
    </button>
  )
}

export default Button
