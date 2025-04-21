import type React from "react"
import { RefreshCw, RotateCcw } from "lucide-react"

interface HostControlsProps {
  onResetBuzzer: () => void
  onResetGame: () => void
}

const HostControls: React.FC<HostControlsProps> = ({ onResetBuzzer, onResetGame }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={onResetBuzzer}
        className="
          bg-gradient-to-br from-blue-500 to-blue-600
          hover:from-blue-600 hover:to-blue-700
          text-white px-6 py-4 rounded-xl
          flex items-center justify-center gap-2
          transition-all duration-300
          shadow-lg shadow-blue-500/25
          transform hover:scale-105
        "
      >
        <RefreshCw className="w-5 h-5" />
        <span className="arabic-text">إعادة البازر</span>
      </button>

      <button
        onClick={onResetGame}
        className="
          bg-gradient-to-br from-gray-600 to-gray-700
          hover:from-gray-700 hover:to-gray-800
          text-white px-6 py-4 rounded-xl
          flex items-center justify-center gap-2
          transition-all duration-300
          shadow-lg shadow-gray-500/25
          transform hover:scale-105
        "
      >
        <RotateCcw className="w-5 h-5" />
        <span className="arabic-text">إعادة اللعبة</span>
      </button>
    </div>
  )
}

export default HostControls