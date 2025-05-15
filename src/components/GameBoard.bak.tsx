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
      --s: 80px;  /* Slightly smaller for better fit */
      --gap: 2px;
      --h: calc(var(--s) * 1.1547);
      display: flex;
      flex-direction: row;  /* Changed to row to create horizontal grid */
      padding: calc(var(--gap)/2);
      margin: 0 auto;
      width: fit-content;
    }

    .honeycomb-column {
      display: flex;
      flex-direction: column; /* Each column is vertical */
      width: calc(var(--s) * 0.75);
      margin-right: var(--gap);
    }

    .honeycomb-column:nth-child(even) {
      margin-top: calc(var(--h)/2); /* Shift every other column down */
    }

    .honeycomb-column:last-child {
      margin-right: 0;
    }

    .hexagon {
      width: var(--s);
      height: var(--h);
      clip-path: polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--gap);
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
          {/* Transpose the board to create columns instead of rows */}
          {Array.from({ length: board[0].length }).map((_, colIndex) => (
            <div key={`col-${colIndex}`} className="honeycomb-column">
              {board.map((row, rowIndex) => {
                // Get the current tile from the transposed position
                const tile = row[colIndex];
                
                // Set colors based on position in the rotated grid
                // Now the left and right columns are RED
                // The top and bottom rows are GREEN
                let bgColor = "bg-blue-300" // Default inner cells are light blue
                
                // First and last column are RED
                if (colIndex === 0 || colIndex === board[0].length - 1) {
                  bgColor = "bg-red-500"
                }
                // First and last row are GREEN (but not the corners)
                else if ((rowIndex === 0 || rowIndex === board.length - 1) && 
                         colIndex !== 0 && colIndex !== board[0].length - 1) {
                  bgColor = "bg-green-500"
                }
                
                // Handle any explicitly set colors from game logic
                if (tile === "green") bgColor = "bg-green-500"
                if (tile === "red") bgColor = "bg-red-500"

                const isEditable = isEditableTile(rowIndex, colIndex)
                const letter = letters?.[rowIndex]?.[colIndex] || ""
                const isActive = activeTile?.row === rowIndex && activeTile?.col === colIndex
                
                return (
                  <div
                    key={`tile-${rowIndex}-${colIndex}`}
                    className={`hexagon ${bgColor} ${isActive ? "active" : ""} ${isEditable ? "" : "border"}`}
                    onClick={() => handleClick(rowIndex, colIndex)}
                  >
                    <span className="text-lg font-bold text-gray-700">{letter}</span>
                    
                    {/* Show color selection dots if tile is clicked */}
                    {isWaitingForDots && clickedTile?.row === rowIndex && clickedTile?.col === colIndex && (
                      <div className="absolute top-full mt-2 dots-menu shadow-lg bg-white/80 backdrop-blur-sm p-2 rounded-full border border-gray-200">
                        <button
                          className="dot-button bg-green-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDotClick("green", rowIndex, colIndex)
                          }}
                        ></button>
                        <button
                          className="dot-button bg-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDotClick("red", rowIndex, colIndex)
                          }}
                        ></button>
                        <button
                          className="dot-button bg-blue-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDotClick(null, rowIndex, colIndex)
                          }}
                        ></button>
                      </div>
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