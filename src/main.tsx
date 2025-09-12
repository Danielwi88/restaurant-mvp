import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Providers from './app/providers.tsx'
import AppRoutes from './app/routes.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
    <AppRoutes />

    </Providers>
  </StrictMode>,
)
