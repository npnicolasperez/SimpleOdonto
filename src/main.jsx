import '../design-system.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'

const GOOGLE_CLIENT_ID = '91337212997-i9d7g3qeldl8ukuk85fvi8vu1bl7oad1.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
)
