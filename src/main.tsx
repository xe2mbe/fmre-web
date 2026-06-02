import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FMREPage from './FMREPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FMREPage />
  </StrictMode>,
)
