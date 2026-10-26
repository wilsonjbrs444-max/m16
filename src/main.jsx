import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { configOk } from './supabase.js'
import { AuthProvider } from './auth.jsx'
import { CartProvider } from './cart.jsx'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  configOk ? (
    <ErrorBoundary>
      <BrowserRouter><AuthProvider><CartProvider><App /></CartProvider></AuthProvider></BrowserRouter>
    </ErrorBoundary>
  ) : (
    <div className="wrap">
      <div className="panel">
        <h1>Configuration manquante</h1>
        <p>Les variables <b>VITE_SUPABASE_URL</b> et <b>VITE_SUPABASE_ANON_KEY</b> ne sont pas définies.</p>
      </div>
    </div>
  )
)
