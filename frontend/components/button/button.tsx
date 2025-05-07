'use client'
import { HTMLProps, ReactNode } from 'react'
import { IconContext } from 'react-icons'
import { FiEdit3 } from 'react-icons/fi'
import { IoSaveOutline, IoArrowBack, IoArrowForward } from 'react-icons/io5'
import { GrAddCircle } from 'react-icons/gr'
import { ImCancelCircle } from 'react-icons/im'
import { MdDelete } from 'react-icons/md'
import { AiOutlineLogout, AiOutlineLogin } from 'react-icons/ai'

import styles from './button.module.scss'

interface ButtonProps extends HTMLProps<HTMLButtonElement> {
  children: ReactNode
  icon?: 'edit' | 'save' | 'add' | 'delete' | 'cancel' | 'logout' | 'login' | 'back' | 'forward'
  iconElement?: JSX.Element
}

const Button = ({ children, icon, iconElement, type, className, ...rest }: ButtonProps) => {
  let iconType = undefined
  let warning = false

  if (iconElement) {
    iconType = iconElement
  } else {
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
    if (icon === 'back') {
      iconType = (<IoArrowBack />)
    }
    if (icon === 'forward') {
      iconType = (<IoArrowForward />)
    }
  }

  let iconClassName = warning ? styles.iconWarningColor : styles.iconColor
  if (className?.includes('btn-primary')) {
    iconClassName += ` ${styles.iconPrimaryColor}`
  }

  return (
    <button type="button" className={`${className?.includes('btn') ? '' : styles.button} ${warning && styles.warning} ${className}`} {...rest}>
      <IconContext.Provider value={{ className: iconClassName }}>
        {iconType}
      </IconContext.Provider>
      {children}
    </button>
  )
}

export default Button
