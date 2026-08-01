import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
  <main style={{ padding: "40px", color: "white" }}>
    <h1>🏈 HOG GM</h1>

    <h2>Honda on Grand Draft Assistant</h2>

    <p>
      Welcome to the first production version of HOG.
    </p>

    <button>
      Enter War Room
    </button>
  </main>
)
}

export default App
