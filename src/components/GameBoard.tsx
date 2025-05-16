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

  // Create flat array for hex grid layout
  const flatTiles = board.flat().map((tile, index) => {
    const rowIndex = Math.floor(index / board[0].length)
    const colIndex = index % board[0].length
    return { tile, rowIndex, colIndex }
  })

  return (
    <div className="flex justify-center items-center" style={{ marginTop: '120px', width: '100%' }}>
      <style>
        {`
          .hex-grid{
            display: grid;
            /* Define grid columns for horizontal interlocking (approx 75% of hexagon width) */
            grid-template-columns: repeat(7, 160px); /* Increased from 130px */

            /* Define grid rows for vertical spacing (half of hexagon height) */
            grid-template-rows: repeat(7, 92px); /* Increased from 75px */

            /* Remove gap as margins will handle spacing */
            /* gap: 5px; */

            /* Center the grid */
            margin: 0 auto;

            /* Rotate the entire grid 180 degrees */
            transform: rotate(180deg);

            /* Removed margin: 10px; to prevent extra space around the grid */
          }

          .hex-grid .hex{
            /* Set hexagon width and height */
            width: 210px; /* Increased from 170px */
            height: 105px; /* Increased from 85px */

            /* Add light black outline using box-shadow */
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2); /* Adjust spread and alpha for desired outline */

            /* Remove initial background-color here, will be set by specific rules */
            /* background-color: rgb(83, 201, 209); */

            clip-path: polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%);
            transition: all 0.3s;
            
            /* Display settings for content */
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            
            /* Text styling */
            color: black;
            font-size: 3rem; /* Increased from 2.5rem */
            font-weight: bold;
          }

          /* Counter-rotate the content inside each hex to keep letters upright */
          .hex-grid .hex > * {
            transform: rotate(180deg);
          }

          /* Shift hexagons in columns 1, 3, 5, and 7 upwards */
          .hex-grid .hex:nth-child(7n + 1), /* Column 1 */
          .hex-grid .hex:nth-child(7n + 3), /* Column 3 */
          .hex-grid .hex:nth-child(7n + 5), /* Column 5 */
          .hex-grid .hex:nth-child(7n + 7)  /* Column 7 */
          {
            margin-top: 138px; /* Adjusted from 112px */
            gap: 0px;
          }

          /* Shift hexagons in columns 2, 4, and 6 downwards */
          .hex-grid .hex:nth-child(7n + 2), /* Column 2 */
          .hex-grid .hex:nth-child(7n + 4), /* Column 4 */
          .hex-grid .hex:nth-child(7n + 6)  /* Column 6 */
          {
            margin-top: 92px; /* Adjusted from 75px */
            gap: 0px;
          }

          /* Color the middle hexagons blue */
          /* Selects all hexagons NOT in the first row (-n+7), last row (n+43), first column (7n+1), or last column (7n+7) */
          .hex-grid .hex:not(:nth-child(-n + 7)):not(:nth-child(n + 43)):not(:nth-child(7n + 1)):not(:nth-child(7n + 7)) {
            background-color:rgb(246, 246, 247);
            box-shadow: 0 0 10px 2px rgba(246, 246, 247, 0.6);
          }

          /* Color the top border hexagons green (excluding corners) */
          /* Selects hexagons from the 2nd to the 6th (Row 1, Columns 2-6) */
          .hex-grid .hex:nth-child(n + 2):nth-child(-n + 6) {
            background-color:#00cc00;
            box-shadow: 0 0 15px 3px #4ade80;
          }

          /* Color the bottom border hexagons green (excluding corners) */
          /* Selects hexagons from the 44th to the 48th (Row 7, Columns 2-6) */
          .hex-grid .hex:nth-child(n + 44):nth-child(-n + 48) {
            background-color: #00cc00;
            box-shadow: 0 0 15px 3px #4ade80;
          }

          /* Color the side border hexagons red (excluding top and bottom corners) */
          /* Selects hexagons in the first column (7n+1) or last column (7n+7), excluding the first 7 and last 7 */
          .hex-grid .hex:nth-child(7n + 1):not(:nth-child(-n + 7)):not(:nth-child(n + 43)),
          .hex-grid .hex:nth-child(7n + 7):not(:nth-child(-n + 7)):not(:nth-child(n + 43)) {
            background-color:#ff0000;
            box-shadow: 0 0 15px 3px #f33838;
          }

          /* Color the corner hexagons red */
          /* Selects the 1st, 7th, 43rd, and 49th hexagons */
          .hex-grid .hex:nth-child(1),
          .hex-grid .hex:nth-child(7),
          .hex-grid .hex:nth-child(43),
          .hex-grid .hex:nth-child(49) {
            background-color: #ff0000;
            box-shadow: 0 0 15px 3px #f33838;
          }

          .hex-grid .hex.active {
            transform: scale(1.05);
            z-index: 2;
          }
          
          .hex.border {
            cursor: default;
          }
          
          .dots-menu {
            display: flex;
            gap: 8px;
            z-index: 10;
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

          /* Ensure letters display correctly */
          .letter-content {
            display: inline-block;
            transform: rotate(180deg);
          }
        `}
      </style>

      <div className="hex-grid">
        {flatTiles.map(({ tile, rowIndex, colIndex }, index) => {
          const isTopBorder = rowIndex === 0;
          const isBottomBorder = rowIndex === board.length - 1;
          const isLeftBorder = colIndex === 0;
          const isRightBorder = colIndex === board[0].length - 1;
          
          const isEditable = isEditableTile(rowIndex, colIndex);
          const isActive = activeTile?.row === rowIndex && activeTile?.col === colIndex;
          const isClicked = clickedTile?.row === rowIndex && clickedTile?.col === colIndex;
          
          // Background color for custom tiles
          let customBgStyle = {};
          if (tile === "green") customBgStyle = { backgroundColor: "#00cc00" };
          if (tile === "red") customBgStyle = { backgroundColor: "#ff0000" };
          
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`hex ${isActive ? "active" : ""} ${!isEditable ? "border" : ""}`}
              style={customBgStyle}
              onClick={() => handleClick(rowIndex, colIndex)}
            >
              {isClicked ? (
                <div className="dots-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDotClick("green", rowIndex, colIndex);
                    }}
                    className="dot-button"
                    style={{ backgroundColor: "#00cc00" }}
                  ></button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDotClick("red", rowIndex, colIndex);
                    }}
                    className="dot-button"
                    style={{ backgroundColor: "#ff0000" }}
                  ></button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDotClick(null, rowIndex, colIndex);
                    }}
                    className="dot-button"
                    style={{ backgroundColor: "white", border: "1px solid #ccc" }}
                  ></button>
                </div>
              ) : (
                isEditable &&
                tile === "" &&
                letters &&
                letters[rowIndex] &&
                letters[rowIndex][colIndex] && (
                  <span className="letter-content">{letters[rowIndex][colIndex]}</span>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GameBoard