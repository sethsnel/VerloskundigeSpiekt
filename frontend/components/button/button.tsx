'use client'
import { HTMLProps, ReactNode, type JSX } from 'react';
import { IconContext } from 'react-icons'
import { FiEdit3 } from 'react-icons/fi'
import { IoSaveOutline, IoArrowBack, IoArrowForward } from 'react-icons/io5'
import { GrAddCircle } from 'react-icons/gr'
import { ImCancelCircle } from 'react-icons/im'
import { MdDelete } from 'react-icons/md'
import { AiOutlineLogout, AiOutlineLogin } from 'react-icons/ai'
import { Button, buttonVariants } from "@/components/ui/button"
import { VariantProps } from 'class-variance-authority'

// import styles from './button.module.scss'


interface ButtonProps extends HTMLProps<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  icon?: 'edit' | 'save' | 'add' | 'delete' | 'cancel' | 'logout' | 'login' | 'back' | 'forward'
  iconElement?: JSX.Element
}

const VsButton = ({ children, variant, icon, iconElement, type, className, size, ...rest }: ButtonProps) => {
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

  // let iconClassName = warning ? styles.iconWarningColor : styles.iconColor
  // if (className?.includes('btn-primary')) {
  //   iconClassName += ` ${styles.iconPrimaryColor}`
  // }

  return (
    <Button type="button" variant={variant} className={className} {...rest}>
      {/* <IconContext.Provider value={{ className: iconClassName }}>
        {iconType}
      </IconContext.Provider> */}
      <IconContext.Provider value={{ className: 'iconColor' }}>
        {iconType}
      </IconContext.Provider>
      {children}
    </Button>
  )
}

export default VsButton
