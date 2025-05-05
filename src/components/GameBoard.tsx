import type React from "react"
import { useState } from "react"

interface GameBoardProps {
  board: string[][]
  letters: string[][]
  isHost: boolean
  onTileUpdate: (row: number, col: number, color: string | null) => void
}

const GameBoard: React.FC<GameBoardProps> = ({ board, letters, isHost, onTileUpdate }) => {
  const [activeTile, setActiveTile] = useState<{ row: number; col: number } | null>(null)
  const [isWaitingForDots, setIsWaitingForDots] = useState(false)
  const [clickedTile, setClickedTile] = useState<{ row: number; col: number } | null>(null)

  const isEditableTile = (row: number, col: number) => {
    const rows = board.length
    const cols = board[0].length

    const isTopBorder = row === 0
    const isBottomBorder = row === rows - 1
    const isLeftBorder = col === 0
    const isRightBorder = col === cols - 1

    return !(isTopBorder || isBottomBorder || isLeftBorder || isRightBorder)
  }

  const handleClick = (row: number, col: number) => {
    if (!isHost || !isEditableTile(row, col)) return

    if (isWaitingForDots && activeTile?.row === row && activeTile?.col === col) {
      setClickedTile({ row, col })
    } else {
      if (activeTile?.row === row && activeTile?.col === col) {
        setActiveTile(null)
        setIsWaitingForDots(false)
      } else {
        setActiveTile({ row, col })
        setIsWaitingForDots(true)
        setClickedTile(null)
      }
    }
  }

  const handleDotClick = (color: string | null, row: number, col: number) => {
    onTileUpdate(row, col, color)
    setClickedTile(null)
    setIsWaitingForDots(false)
    setActiveTile(null)
  }

  return (
    <>
      <style>
        {`
    @keyframes colorPulse {
      0%, 100% {
        background-color: rgba(74, 222, 128, 0.8);
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(74, 222, 128, 0.8);
      }
      50% {
        background-color: rgba(248, 113, 113, 0.8);
        transform: scale(1);
        box-shadow: 0 0 25px rgba(248, 113, 113, 0.8);
      }
    }

    .honeycomb-grid {
      --s: 90px;
      --gap: 2px;
      --h: calc(var(--s) * 1.1547);
      display: flex;
      flex-direction: column;
      padding-top: calc(var(--h)/4 + var(--gap)/2);
      margin: 0 auto;
      width: fit-content;
    }

    .honeycomb-row {
      display: flex;
      height: calc(var(--h) * 0.75);
      margin-bottom: var(--gap);
    }

    .honeycomb-row:first-child {
      height: calc(var(--h) * 0.75 - var(--gap));
      margin-bottom: calc(var(--gap) * 2);
    }

    .honeycomb-row:last-child {
      height: calc(var(--h) * 0.75);
      margin-bottom: 0;
    }

    .honeycomb-row:nth-child(even) {
      margin-left: calc(var(--s)/2 + var(--gap)/2);
    }

    .hexagon {
      width: var(--s);
      height: var(--h);
      clip-path: polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: var(--gap);
      transition: all 0.3s ease;
    }

    .hexagon:last-child {
      margin-right: 0;
    }

    .hexagon.active {
      animation: colorPulse 1.5s infinite;
      z-index: 10;
    }

    .hexagon.active span {
      opacity: 1 !important;
    }

    .hexagon.border {
      pointer-events: none;
      cursor: default;
    }
    
    .hexagon:hover:not(.border) {
      transform: scale(1.05);
      filter: brightness(1.1);
      z-index: 5;
    }
    
    .dots-menu {
      display: flex;
      gap: 8px;
      z-index: 20;
    }
    
    .dot-button {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .dot-button:hover {
      transform: scale(1.2);
    }

    @media (max-width: 768px) {
      .honeycomb-grid {
        --s: 70px;
      }
    }

    @media (min-width: 1200px) {
      .honeycomb-grid {
        --s: 100px;
      }
    }
  `}
      </style>

      {/* Game Board */}
      <div className="relative flex justify-center items-center w-full">
        {/* Background glow effects */}
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full w-1/2 h-1/2 mx-auto my-auto"></div>
        <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full w-1/3 h-1/3 mx-auto my-auto animate-pulse"></div>

        <div className="honeycomb-grid relative z-10 mx-auto">
          {board.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="honeycomb-row">
              {row.map((tile, colIndex) => {
                const isTopBorder = rowIndex === 0
                const isBottomBorder = rowIndex === board.length - 1
                const isLeftBorder = colIndex === 0
                const isRightBorder = colIndex === row.length - 1

                let bgColor = "bg-white/90"
                if (isTopBorder || isBottomBorder) bgColor = "bg-green-500"
                if (isLeftBorder || isRightBorder) bgColor = "bg-red-500"
                if (tile === "green") bgColor = "bg-green-500"
                if (tile === "red") bgColor = "bg-red-500"

                const isEditable = isEditableTile(rowIndex, colIndex)
                const isActive = activeTile?.row === rowIndex && activeTile?.col === colIndex
                const isClicked = clickedTile?.row === rowIndex && clickedTile?.col === colIndex

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      ${bgColor} hexagon 
                      ${isActive ? "active" : ""} 
                      ${!isEditable ? "border" : ""}
                      flex items-center justify-center 
                      text-2xl font-bold
                      transition-all duration-300
                      ${isEditable ? "cursor-pointer" : "cursor-default"}
                    `}
                    onClick={() => handleClick(rowIndex, colIndex)}
                  >
                    {isClicked ? (
                      <div className="dots-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDotClick("green", rowIndex, colIndex)
                          }}
                          className="dot-button bg-green-500"
                        ></button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDotClick("red", rowIndex, colIndex)
                          }}
                          className="dot-button bg-red-500"
                        ></button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDotClick(null, rowIndex, colIndex)
                          }}
                          className="dot-button bg-white"
                        ></button>
                      </div>
                    ) : (
                      isEditable &&
                      tile === "" && (
                        <span className={`${isActive ? "opacity-100" : "opacity-80"} text-black text-3xl`}>
                          {letters && letters[rowIndex] && letters[rowIndex][colIndex]}
                        </span>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default GameBoard