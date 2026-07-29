/**
 * Context para saber si la app corre en modo demo, sin tener que hacer prop drilling
 * por 4 niveles hasta VistaEstudios / VistaNuevaConsulta / etc.
 *
 * Default: false. DemoApp lo pone en true al montarse.
 * Cualquier componente que necesite saberlo hace: `const demoMode = useContext(DemoContext)`.
 */
import { createContext } from 'react'

export const DemoContext = createContext(false)
