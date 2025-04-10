'use client'

import { useEffect, useRef } from 'react'
import { Offcanvas } from 'bootstrap'

import styles from './menu.module.scss'

interface OffcanvasMenuProps {
  children: JSX.Element
}

const OffcanvasMenu = ({ children }: OffcanvasMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (menuRef !== null && menuRef.current !== null) {
      const menuOffcanvas = new Offcanvas(menuRef.current)
      const hideMenuOnClick = (e: Event) => {
        const excludeElements = ['INPUT', 'NAV', 'DIV']
        if (excludeElements.includes((e.target as any).nodeName)) {
          return
        }

        menuOffcanvas.hide()
      }
      menuRef.current.addEventListener('click', hideMenuOnClick)

      return () => {
        menuRef.current?.removeEventListener('click', hideMenuOnClick)
      }
    }
  }, [])

  return (
    <div className="offcanvas offcanvas-start bg-white" tabIndex={-1} id="offcanvasMenu" aria-labelledby="offcanvasMenuLabel" ref={menuRef}>
      <div className="offcanvas-header">
        <h5 className="offcanvas-title" id="offcanvasMenuLabel">Menu</h5>
        <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div className={`offcanvas-body`}>
        <nav className={`${styles.nav}`}>
          {children}
        </nav>
      </div>
    </div>
  )
}

export default OffcanvasMenu
