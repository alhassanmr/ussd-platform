import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './AdminApp.jsx'

// Route /admin to the admin portal, everything else to the tenant app
const isAdmin = window.location.pathname.startsWith('/admin')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </StrictMode>
)
