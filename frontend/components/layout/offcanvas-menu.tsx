'use client'
import { useEffect } from 'react'
import { Offcanvas } from 'bootstrap'

import styles from './menu.module.scss'

interface OffcanvasMenuProps {
  children: JSX.Element
}

const OffcanvasMenu = ({ children }: OffcanvasMenuProps) => {
  useEffect(() => {
    var menuOffcanvasElement = document.getElementById('offcanvasMenu')
    if (menuOffcanvasElement !== null) {
      const menuOffcanvas = new Offcanvas(menuOffcanvasElement)
      menuOffcanvasElement.onclick = (e) => {
        menuOffcanvas.hide()
      }
    }
  }, [])

  return (
    <div className="offcanvas offcanvas-start bg-white" tabIndex={-1} id="offcanvasMenu" aria-labelledby="offcanvasMenuLabel">
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
