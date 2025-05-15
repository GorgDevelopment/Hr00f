import type React from "react"
import { useEffect, useState } from "react"
import GameBoard from "../components/GameBoard"
import Buzzer from "../components/Buzzer"
import Confetti from "react-confetti"
import { ArrowLeft, Trophy, Users } from "lucide-react"
import {
  getGame,
  getBuzzerState,
  getPlayers,
  updateGame,
  updateBuzzerState,
  addPlayer,
  deleteGame,
  saveUserSession,
  generateRandomLetters,
} from "../lib/api"

interface GameState {
  board: string[][]
  greenScore: number
  redScore: number
  letters?: string[][]
  greenConnections?: boolean
  redConnections?: boolean
}

interface GameRoomProps {
  roomCode: string
  isHost: boolean
  username: string
  onLeaveRoom: () => void
}

const GameRoom: React.FC<GameRoomProps> = ({ roomCode, isHost, username, onLeaveRoom }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array.from({ length: 7 }, () => Array(7).fill("")),
    greenScore: 0,
    redScore: 0,
    letters: Array.from({ length: 7 }, () => Array(7).fill("أ")),
    greenConnections: false,
    redConnections: false,
  })
  const [currentTeam, setCurrentTeam] = useState<"red" | "green">("green")
  const [buzzerActive, setBuzzerActive] = useState(true)
  const [team, setTeam] = useState<"red" | "green" | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [winner, setWinner] = useState<"green" | "red" | null>(null)
  const [showWinnerPanel, setShowWinnerPanel] = useState(false)
  const [buzzerPlayer, setBuzzerPlayer] = useState<string | null>(null)
  const [showBuzzerConfetti, setShowBuzzerConfetti] = useState(false)
  const [winnerAnimationStep, setWinnerAnimationStep] = useState(0)
  const [greenTeamName, setGreenTeamName] = useState("الفريق الأخضر")
  const [redTeamName, setRedTeamName] = useState("الفريق الأحمر")
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Polling interval for updates (in milli fuckers)
  const POLL_INTERVAL = 2000

  useEffect(() => {
    let isMounted = true
    let pollTimer: number

    const loadGameData = async () => {
      try {
        // Get game data
        const game = await getGame(roomCode)
        if (isMounted && game) {
          console.log("Loaded game state:", game.current_state);
          setGameState(game.current_state)
          setCurrentTeam(game.current_team)
          setGreenTeamName(game.green_team_name)
          setRedTeamName(game.red_team_name)

          if (game.winner !== winner) {
            setWinner(game.winner)
            setShowWinnerPanel(game.winner !== null)
          }
        }

        // Get buzzer state
        const buzzerState = await getBuzzerState(roomCode)
        if (isMounted && buzzerState) {
          setBuzzerActive(!!buzzerState.active)
          if (!buzzerState.active && buzzerState.buzzed_player) {
            setBuzzerPlayer(buzzerState.buzzed_player)
            setShowBuzzerConfetti(true)
          } else {
            setBuzzerPlayer(null)
            setShowBuzzerConfetti(false)
          }
        }

        const playersList = await getPlayers(roomCode)
        if (isMounted) {
          setPlayers(playersList)

          if (!isHost) {
            const existingPlayer = playersList.find((p: any) => p.username === username)
            if (existingPlayer) {
              setTeam(existingPlayer.team)
              saveUserSession({
                roomCode,
                username,
                isHost,
                team: existingPlayer.team,
              })
            }
          }
        }

        if (isMounted && !initialized) {
          setInitialized(true)
        }
      } catch (err: any) {
        console.error("Error loading game data:", err)
        if (isMounted) {
          setError(err.message || "Failed to load game data")
        }
      }
    }

    loadGameData()
    pollTimer = window.setInterval(loadGameData, POLL_INTERVAL)

    return () => {
      isMounted = false
      clearInterval(pollTimer)
    }
  }, [roomCode, isHost, username, initialized, winner])
  useEffect(() => {
    if (showWinnerPanel) {
      const interval = setInterval(() => {
        setWinnerAnimationStep((prev) => (prev + 1) % 4)
      }, 800)

      return () => clearInterval(interval)
    }
  }, [showWinnerPanel])

  const handleTileUpdate = async (row: number, col: number, color: string | null) => {
    if (!isHost) return

    const newBoard = gameState.board.map((r) => [...r])
    newBoard[row][col] = color || ""
    
    // Check for connections and update scores
    let greenScore = gameState.greenScore
    let redScore = gameState.redScore
    let greenConnections = gameState.greenConnections || false
    let redConnections = gameState.redConnections || false

    // Check for green connection (top to bottom)
    const hasGreenConnection = hasGreenPath(newBoard)
    if (hasGreenConnection && !greenConnections) {
      greenScore += 1
      greenConnections = true
    } else if (!hasGreenConnection) {
      greenConnections = false
    }

    // Check for red connection (left to right)
    const hasRedConnection = hasRedPath(newBoard)
    if (hasRedConnection && !redConnections) {
      redScore += 1
      redConnections = true
    } else if (!hasRedConnection) {
      redConnections = false
    }

    const winResult = checkWinCondition(newBoard)
    const newGameState = {
      ...gameState,
      board: newBoard,
      greenScore: greenScore,
      redScore: redScore,
      greenConnections: greenConnections,
      redConnections: redConnections,
    }

    const nextTeam = currentTeam === "red" ? "green" : "red"

    try {
      await updateGame(roomCode, {
        current_state: newGameState,
        current_team: nextTeam,
        winner: winResult,
      })

      setGameState(newGameState)
      setCurrentTeam(nextTeam)

      if (winResult) {
        setWinner(winResult)
        setShowWinnerPanel(true)
      }
    } catch (err) {
      console.error("Error updating game:", err)
    }
  }

  const dfs = (
    board: string[][],
    row: number,
    col: number,
    color: string,
    visited: boolean[][],
    rows: number,
    cols: number,
  ) => {

    if (row < 0 || row >= rows || col < 0 || col >= cols || board[row][col] !== color || visited[row][col]) {
      return
    }

    visited[row][col] = true

    const directions = [
      [-1, 0], // up
      [1, 0], // down
      [0, -1], // left
      [0, 1], // right
      [-1, -1], // up left
      [-1, 1], // up right
      [1, -1], // down left
      [1, 1], // down right
    ]

    for (const [dr, dc] of directions) {
      dfs(board, row + dr, col + dc, color, visited, rows, cols)
    }
  }

  const hasGreenPath = (board: string[][]) => {
    const rows = board.length
    const cols = board[0].length
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false))

    for (let col = 1; col < cols - 1; col++) {
      if (board[1][col] === "green") {
        dfs(board, 1, col, "green", visited, rows, cols)
      }
    }

    for (let col = 1; col < cols - 1; col++) {
      if (board[rows - 2][col] === "green" && visited[rows - 2][col]) {
        return true
      }
    }

    return false
  }

  const hasRedPath = (board: string[][]) => {
    const rows = board.length
    const cols = board[0].length
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false))

    for (let row = 1; row < rows - 1; row++) {
      if (board[row][1] === "red") {
        dfs(board, row, 1, "red", visited, rows, cols)
      }
    }

    for (let row = 1; row < rows - 1; row++) {
      if (board[row][cols - 2] === "red" && visited[row][cols - 2]) {
        return true
      }
    }

    return false
  }

  const checkWinCondition = (updatedBoard: string[][]): "green" | "red" | null => {
    const rows = updatedBoard.length
    const cols = updatedBoard[0].length

    // Check vertical lines (green wins)
    for (let col = 1; col <= cols - 2; col++) {
      const isVerticalWin = updatedBoard.slice(1, rows - 1).every((row) => row[col] === "green")
      if (isVerticalWin) {
        return "green"
      }
    }

    // Check horizontal lines (red wins)
    for (let row = 1; row <= rows - 2; row++) {
      const isHorizontalWin = updatedBoard[row].slice(1, cols - 1).every((tile) => tile === "red")
      if (isHorizontalWin) {
        return "red"
      }
    }

    if (hasGreenPath(updatedBoard)) {
      return "green"
    }

    if (hasRedPath(updatedBoard)) {
      return "red"
    }

    return null
  }

  const handleBuzz = async () => {
    if (!team || !username) return

    try {
      await updateBuzzerState(roomCode, {
        active: false,
        buzzed_team: team,
        buzzed_player: username,
        buzzed_at: new Date().toISOString(),
      })

      setBuzzerActive(false)
    } catch (err) {
      console.error("Error updating buzzer:", err)
    }
  }

  const handleResetBuzzer = async () => {
    if (!isHost) return

    try {
      await updateBuzzerState(roomCode, {
        active: true,
        buzzed_team: null,
        buzzed_player: null,
        buzzed_at: null,
      })

      setBuzzerActive(true)
      setBuzzerPlayer(null)
      setShowBuzzerConfetti(false)
    } catch (err) {
      console.error("Error resetting buzzer:", err)
    }
  }

  // Keep this function for resetting just the board, preserving scores
  const handleResetGame = async () => {
    if (!isHost) return
    
    // Generate new random letters
    const newLetters = generateRandomLetters(7, 7)
    
    // Create a completely fresh board
    const newGameState = {
      board: Array.from({ length: 7 }, () => Array(7).fill("")),
      greenScore: gameState.greenScore,
      redScore: gameState.redScore,
      letters: newLetters,
      greenConnections: false,
      redConnections: false,
    }

    try {
      // Update game state in database
      await updateGame(roomCode, {
        current_state: newGameState,
        current_team: currentTeam,
        winner: null,
      })

      // Update local state
      setGameState(newGameState)
      setWinner(null)
      setShowWinnerPanel(false)
      
      console.log("Board reset with new letters:", newLetters);
    } catch (err) {
      console.error("Error resetting game:", err)
    }
  }

  // This function resets everything including scores
  const handleGlobalReset = async () => {
    if (!isHost) return
    
    // Reset everything including scores
    const newLetters = generateRandomLetters(7, 7)
    
    const newGameState = {
      board: Array.from({ length: 7 }, () => Array(7).fill("")),
      greenScore: 0,
      redScore: 0,
      letters: newLetters,
      greenConnections: false,
      redConnections: false,
    }

    try {
      await updateGame(roomCode, {
        current_state: newGameState,
        current_team: "green",
        winner: null,
      })

      await handleResetBuzzer()
      setGameState(newGameState)
      setWinner(null)
      setShowWinnerPanel(false)
    } catch (err) {
      console.error("Error resetting game:", err)
    }
  }

  const handleStopGame = async () => {
    if (!isHost) return

    try {
      await deleteGame(roomCode)
      onLeaveRoom()
    } catch (err) {
      console.error("Error stopping game:", err)
    }
  }

  const handleTeamSelect = async (selectedTeam: "red" | "green") => {
    setTeam(selectedTeam)

    try {
      await addPlayer(roomCode, username, selectedTeam)
      setPlayers((prev) => [...prev, { game_id: roomCode, username, team: selectedTeam }])
      saveUserSession({
        roomCode,
        username,
        isHost,
        team: selectedTeam,
      })
    } catch (err) {
      console.error("Error adding player:", err)
    }
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-2xl mb-4 arabic-text">خطأ</div>
          <div className="mb-6 arabic-text">{error}</div>
          <button onClick={onLeaveRoom} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg arabic-text">
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  // Show loading state if not initialized
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl arabic-text">جارٍ التحميل...</div>
      </div>
    )
  }
  if (!team && !isHost) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 animate-pulse arabic-text">
            اختر فريقك
          </h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => handleTeamSelect("red")}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/30 text-xl font-bold arabic-text"
            >
              {redTeamName}
            </button>
            <button
              onClick={() => handleTeamSelect("green")}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/30 text-xl font-bold arabic-text"
            >
              {greenTeamName}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Player view
  if (!isHost) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-[url('/hexagon-pattern.png')] opacity-5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

        {/* Buzzer Confetti */}
        {showBuzzerConfetti && buzzerPlayer && (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={150}
              gravity={0.2}
              colors={["#10b981", "#34d399", "#ef4444", "#f87171", "#3b82f6", "#60a5fa"]}
            />
            <div className="bg-black/70 px-8 py-4 rounded-xl text-center animate-bounce">
              <h3 className="text-3xl font-bold text-white mb-2 arabic-text">{buzzerPlayer}</h3>
              <p className="text-xl text-yellow-400 arabic-text">ضغط الجرس أولاً!</p>
            </div>
          </div>
        )}

        {/* Winner Panel */}
        {showWinnerPanel && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={true}
              numberOfPieces={200}
              colors={
                winner === "green"
                  ? ["#10b981", "#34d399", "#6ee7b7", "#ecfdf5"]
                  : ["#ef4444", "#f87171", "#fca5a5", "#fee2e2"]
              }
            />

            <div
              className={`
              bg-gradient-to-br 
              ${winner === "green" ? "from-green-900 to-green-700" : "from-red-900 to-red-700"} 
              p-10 rounded-2xl shadow-2xl text-center
              transform transition-all duration-500
              ${winnerAnimationStep === 0 ? "scale-100 rotate-0" : ""}
              ${winnerAnimationStep === 1 ? "scale-105 rotate-1" : ""}
              ${winnerAnimationStep === 2 ? "scale-100 rotate-0" : ""}
              ${winnerAnimationStep === 3 ? "scale-105 rotate-[-1deg]" : ""}
            `}
            >
              <div className="mb-6">
                <Trophy
                  className={`
                  w-20 h-20 mx-auto 
                  ${winner === "green" ? "text-green-300" : "text-red-300"}
                  animate-pulse
                `}
                />
              </div>

              <h2 className="text-5xl font-bold mb-4 arabic-text">
                {winner === "green" ? `${greenTeamName} يفوز!` : `${redTeamName} يفوز!`}
              </h2>

              <div className="w-32 h-1 mx-auto my-6 bg-white/30 rounded-full"></div>

              <p className="text-2xl mb-8 arabic-text">تهانينا للفائز!</p>
            </div>
          </div>
        )}

        {/* Game Header */}
        <div className="flex justify-between items-center mb-4">
          {/* Red Team Score */}
          <div className="bg-gradient-to-r from-red-700 to-red-500 text-white py-3 px-6 rounded-r-full flex items-center gap-4 shadow-lg shadow-red-500/30">
            <div className="text-3xl font-bold">{gameState.redScore}</div>
            <div className="text-xl font-bold arabic-text">{redTeamName}</div>
          </div>

          {/* Room Code */}
          <div className="text-center relative">
            <h2 className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              {roomCode}
            </h2>
            {buzzerPlayer ? (
              <div className="text-sm px-4 py-1 rounded-full bg-yellow-500 text-black font-bold arabic-text">
                {buzzerPlayer} ضغط الجرس!
              </div>
            ) : (
              <div className="text-sm px-4 py-1 rounded-full text-gray-400 arabic-text">اضغط الجرس للإجابة</div>
            )}
          </div>

          {/* Green Team Score */}
          <div className="bg-gradient-to-r from-green-500 to-green-700 text-white py-3 px-6 rounded-l-full flex items-center gap-4 shadow-lg shadow-green-500/30">
            <div className="text-xl font-bold arabic-text">{greenTeamName}</div>
            <div className="text-3xl font-bold">{gameState.greenScore}</div>
          </div>
        </div>

        {/* Team Players */}
        <div className="flex justify-between mb-3">
          {/* Red Team Players */}
          <div className="bg-red-500/20 text-white py-3 px-6 rounded-lg shadow-md w-64">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-red-400" />
              <div className="text-lg font-bold arabic-text text-red-400">{redTeamName}</div>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {players
                .filter((p) => p.team === "red")
                .map((p) => (
                  <div key={p.username} className="text-sm bg-red-500/10 px-2 py-1 rounded">
                    {p.username}
                  </div>
                ))}
            </div>
          </div>

          {/* Green Team Players */}
          <div className="bg-green-500/20 text-white py-3 px-6 rounded-lg shadow-md w-64">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-400" />
              <div className="text-lg font-bold arabic-text text-green-400">{greenTeamName}</div>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {players
                .filter((p) => p.team === "green")
                .map((p) => (
                  <div key={p.username} className="text-sm bg-green-500/10 px-2 py-1 rounded">
                    {p.username}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Centered Buzzer */}
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4">
            <Buzzer isActive={buzzerActive} team={team} onBuzz={handleBuzz} />
          </div>

          {/* Leave Room Button */}
          <button
            onClick={onLeaveRoom}
            className="mt-8 bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <span className="arabic-text">مغادرة الغرفة</span>
          </button>
        </div>
      </div>
    )
  }

  // Host view
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/hexagon-pattern.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

      {/* Buzzer Confetti */}
      {showBuzzerConfetti && buzzerPlayer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={150}
            gravity={0.2}
            colors={["#10b981", "#34d399", "#ef4444", "#f87171", "#3b82f6", "#60a5fa"]}
          />
          <div className="bg-black/70 px-8 py-4 rounded-xl text-center animate-bounce">
            <h3 className="text-3xl font-bold text-white mb-2 arabic-text">{buzzerPlayer}</h3>
            <p className="text-xl text-yellow-400 arabic-text">ضغط الجرس أولاً!</p>
          </div>
        </div>
      )}

      {/* Winner Panel */}
      {showWinnerPanel && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={true}
            numberOfPieces={200}
            colors={
              winner === "green"
                ? ["#10b981", "#34d399", "#6ee7b7", "#ecfdf5"]
                : ["#ef4444", "#f87171", "#fca5a5", "#fee2e2"]
            }
          />

          <div
            className={`
            bg-gradient-to-br 
            ${winner === "green" ? "from-green-900 to-green-700" : "from-red-900 to-red-700"} 
            p-10 rounded-2xl shadow-2xl text-center
            transform transition-all duration-500
            ${winnerAnimationStep === 0 ? "scale-100 rotate-0" : ""}
            ${winnerAnimationStep === 1 ? "scale-105 rotate-1" : ""}
            ${winnerAnimationStep === 2 ? "scale-100 rotate-0" : ""}
            ${winnerAnimationStep === 3 ? "scale-105 rotate-[-1deg]" : ""}
          `}
          >
            <div className="mb-6">
              <Trophy
                className={`
                w-20 h-20 mx-auto 
                ${winner === "green" ? "text-green-300" : "text-red-300"}
                animate-pulse
              `}
              />
            </div>

            <h2 className="text-5xl font-bold mb-4 arabic-text">
              {winner === "green" ? `${greenTeamName} يفوز!` : `${redTeamName} يفوز!`}
            </h2>

            <div className="w-32 h-1 mx-auto my-6 bg-white/30 rounded-full"></div>

            <p className="text-2xl mb-8 arabic-text">تهانينا للفائز!</p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={handleResetGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 text-xl font-bold arabic-text"
              >
                جولة جديدة        
              </button>
              <button
                onClick={handleStopGame}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 text-xl font-bold arabic-text"
              >
                إغلاق اللعبة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        {/* Red Team Score */}
        <div className="bg-gradient-to-r from-red-700 to-red-500 text-white py-3 px-6 rounded-r-full flex items-center gap-4 shadow-lg shadow-red-500/30">
          <div className="text-3xl font-bold">{gameState.redScore}</div>
          <div className="text-xl font-bold arabic-text">{redTeamName}</div>
        </div>

        {/* Room Code */}
        <div className="text-center relative">
          <h2 className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            {roomCode}
          </h2>
          {buzzerPlayer ? (
            <div className="text-sm px-4 py-1 rounded-full bg-yellow-500 text-black font-bold arabic-text">
              {buzzerPlayer} ضغط الجرس!
            </div>
          ) : (
            <div className="text-sm px-4 py-1 rounded-full text-gray-400 arabic-text">اضغط الجرس للإجابة</div>
          )}
        </div>

        {/* Green Team Score */}
        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white py-3 px-6 rounded-l-full flex items-center gap-4 shadow-lg shadow-green-500/30">
          <div className="text-xl font-bold arabic-text">{greenTeamName}</div>
          <div className="text-3xl font-bold">{gameState.greenScore}</div>
        </div>
      </div>

      {/* Team Players */}
      <div className="flex justify-between mb-3">
        {/* Red Team Players */}
        <div className="bg-red-500/20 text-white py-3 px-6 rounded-lg shadow-md w-64">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-red-400" />
            <div className="text-lg font-bold arabic-text text-red-400">{redTeamName}</div>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {players
              .filter((p) => p.team === "red")
              .map((p) => (
                <div key={p.username} className="text-sm bg-red-500/10 px-2 py-1 rounded">
                  {p.username}
                </div>
              ))}
          </div>
        </div>

        {/* Green Team Players */}
        <div className="bg-green-500/20 text-white py-3 px-6 rounded-lg shadow-md w-64">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-400" />
            <div className="text-lg font-bold arabic-text text-green-400">{greenTeamName}</div>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {players
              .filter((p) => p.team === "green")
              .map((p) => (
                <div key={p.username} className="text-sm bg-green-500/10 px-2 py-1 rounded">
                  {p.username}
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Control Buttons - Fixed Width */}
        <div className="w-24 flex flex-col gap-3 mr-4 shrink-0">
          <button
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105"
            onClick={handleResetGame}
            title="إعادة اللعبة"
          >
            <span className="font-bold">R</span>
          </button>
          <button
            className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transition-transform hover:scale-105"
            onClick={handleStopGame}
            title="إغلاق اللعبة"
          >
            <span className="font-bold">S</span>
          </button>
          <button
            className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
            onClick={handleResetBuzzer}
            title="إعادة الجرس"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={onLeaveRoom}
            className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 hover:from-gray-800 hover:to-gray-950 rounded-lg flex items-center justify-center text-white shadow-lg shadow-gray-500/30 transition-transform hover:scale-105 mt-auto"
            title="مغادرة"
          >
            <span className="font-bold arabic-text mr-[-2px]">خ</span>
          </button>
        </div>

        {/* Center Container - Take remaining space and center the board */}
        <div className="grow flex justify-center items-center mt-[-2rem]">
          <GameBoard
            board={gameState.board}
            letters={gameState.letters || []}
            isHost={isHost}
            onTileUpdate={handleTileUpdate}
          />
        </div>
        
        {/* Empty space to balance the layout */}
        <div className="w-24 shrink-0"></div>
      </div>
    </div>
  )
}

export default GameRoom