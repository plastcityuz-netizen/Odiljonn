import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

// set initial theme before paint
const saved = (() => { try { return localStorage.getItem('balans_theme') } catch { return null } })()
document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
