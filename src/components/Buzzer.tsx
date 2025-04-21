import type React from "react"
import { useState } from "react"

interface BuzzerProps {
  isActive: boolean
  team: "red" | "green" | null
  onBuzz: () => void
}

const Buzzer: React.FC<BuzzerProps> = ({ isActive, team, onBuzz }) => {
  const [isPressed, setIsPressed] = useState(false)

  const handleBuzz = () => {
    if (!isActive) return

    setIsPressed(true)

    setTimeout(() => {
      setIsPressed(false)
      onBuzz()
    }, 150)
  }

  const buttonColor = team === "red" ? "bg-red-600" : team === "green" ? "bg-green-600" : "bg-blue-600"

  return (
    <div className="flex flex-col items-center justify-center">
      {}
      <div className="text-center mb-4">
        <span className={`arabic-text text-lg font-bold ${isActive ? "text-white" : "text-gray-500"}`}>
          {isActive ? "اضغط للإجابة!" : "انتظر..."}
        </span>
      </div>

      {}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {}
        <div className="absolute w-36 h-36 bg-black rounded-full opacity-50 blur-md transform translate-y-1"></div>

        {}
        <div className="absolute w-40 h-40 bg-gray-800 rounded-full"></div>

        {}
        <button
          onClick={handleBuzz}
          disabled={!isActive}
          className={`
            relative
            w-32 h-32
            rounded-full
            ${buttonColor}
            ${isActive ? "hover:brightness-110" : "opacity-70"}
            ${isPressed ? "transform scale-95" : ""}
            transition-all duration-150
            disabled:cursor-not-allowed
            ${isActive && !isPressed ? "buzzer-glow" : ""}
            focus:outline-none
          `}
          style={{
            boxShadow: isPressed ? "inset 0 4px 8px rgba(0, 0, 0, 0.4)" : "0 4px 6px rgba(0, 0, 0, 0.3)",
          }}
        >
          {}
          <div
            className={`
              absolute top-0 left-0 right-0 
              w-full h-1/2 
              rounded-t-full 
              bg-white opacity-20
              pointer-events-none
              ${isPressed ? "opacity-10" : ""}
            `}
          ></div>
        </button>
      </div>

      <style>
        {`
          @keyframes buzzerGlow {
            0%, 100% {
              box-shadow: 0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px ${team === "red" ? "rgba(220, 38, 38, 0.5)" : team === "green" ? "rgba(16, 185, 129, 0.5)" : "rgba(37, 99, 235, 0.5)"};
            }
            50% {
              box-shadow: 0 0 25px rgba(255, 255, 255, 0.7), 0 0 50px ${team === "red" ? "rgba(220, 38, 38, 0.7)" : team === "green" ? "rgba(16, 185, 129, 0.7)" : "rgba(37, 99, 235, 0.7)"};
            }
          }
          
          .buzzer-glow {
            animation: buzzerGlow 1.5s infinite;
          }
        `}
      </style>
    </div>
  )
}

export default Buzzer