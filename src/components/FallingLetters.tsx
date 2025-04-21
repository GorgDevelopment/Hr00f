import type React from "react"
import { useEffect, useState } from "react"

const ARABIC_LETTERS = "أبتثجحخدذرزسشصضطظعغفقكلمنهوي".split("")

interface FallingLetter {
  id: number
  letter: string
  left: number
  delay: number
  duration: number
  scale: number
  opacity: number
  color: string
}

const FallingLetters: React.FC = () => {
  const [letters, setLetters] = useState<FallingLetter[]>([])

  useEffect(() => {
    // Colors for letters
    const colors = [
      "text-red-400",
      "text-green-400",
      "text-blue-400",
      "text-yellow-400",
      "text-purple-400",
      "text-pink-400",
    ]

    const createLetter = (id: number) => ({
      id,
      letter: ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
      scale: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)],
    })

    const initialLetters = Array.from({ length: 30 }, (_, i) => createLetter(i))
    setLetters(initialLetters)

    const interval = setInterval(() => {
      setLetters((prev) =>
        prev.map((letter) => (letter.delay <= 0 ? createLetter(letter.id) : { ...letter, delay: letter.delay - 0.1 })),
      )
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {letters.map((letter) => (
        <div
          key={letter.id}
          className={`falling-letter ${letter.color}`}
          style={{
            left: `${letter.left}%`,
            animationDelay: `${letter.delay}s`,
            animationDuration: `${letter.duration}s`,
            transform: `scale(${letter.scale})`,
            opacity: letter.opacity,
          }}
        >
          {letter.letter}
        </div>
      ))}
    </div>
  )
}

export default FallingLetters