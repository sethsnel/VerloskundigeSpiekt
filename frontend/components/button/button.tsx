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

const Button = (props: ButtonProps) => {
  let icon = undefined
  let warning = false

  if (props.icon === 'edit') {
    icon = (<FiEdit3 />)
  }
  if (props.icon === 'save') {
    icon = (<IoSaveOutline />)
  }
  if (props.icon === 'add') {
    icon = (<GrAddCircle />)
  }
  if (props.icon === 'delete') {
    warning = true
    icon = (<MdDelete />)
  }
  if (props.icon === 'cancel') {
    icon = (<ImCancelCircle />)
  }
  if (props.icon === 'logout') {
    icon = (<AiOutlineLogout />)
  }
  if (props.icon === 'login') {
    icon = (<AiOutlineLogin />)
  }


  return (
    <button onClick={() => props?.onClick && props.onClick()} className={`${styles.button} ${warning && styles.warning}`}>
      <IconContext.Provider value={{ className: styles.iconColor }}>
        {icon}
      </IconContext.Provider>
      {props.children}
    </button>
  )
}

export default Button
