import { useState, useEffect } from "react"
import Home from "./pages/Home"
import GameRoom from "./pages/GameRoom"
import { createGame, getUserSession, saveUserSession, clearUserSession } from "./lib/localDatabase"

function App() {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [isHost, setIsHost] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const isNewTab = !sessionStorage.getItem("tabInitialized")

    if (isNewTab) {
      sessionStorage.setItem("tabInitialized", "true")
      clearUserSession()
      setLoading(false)
      return
    }

    const session = getUserSession()
    if (session) {
      console.log("Restoring session:", session)
      setRoomCode(session.roomCode)
      setUsername(session.username)
      setIsHost(session.isHost)
    }
    setLoading(false)
  }, [])

  const handleCreateRoom = (code: string) => {
    const trimmedCode = code.trim()
    setRoomCode(trimmedCode)
    setIsHost(true)
    saveUserSession({
      roomCode: trimmedCode,
      username: "Host",
      isHost: true,
    })
  }

  const handleJoinRoom = (code: string, name: string) => {
    const trimmedCode = code.trim()
    setRoomCode(trimmedCode)
    setUsername(name)
    setIsHost(false)
    saveUserSession({
      roomCode: trimmedCode,
      username: name,
      isHost: false,
    })
  }

  const handleLeaveRoom = () => {
    setRoomCode(null)
    setUsername("")
    setIsHost(false)
    setDevMode(false)
    clearUserSession()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!roomCode) {
    return (
      <div className="relative">
        <Home onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      </div>
    )
  }

  if (devMode) {
    return (
      <div className="flex flex-col h-screen">
        <button
          onClick={() => {
            setDevMode(false)
            setRoomCode(null)
            clearUserSession()
          }}
          className="fixed top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm z-50"
        >
          Exit Dev Mode
        </button>

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Host POV */}
          <div className="flex-1 border-b-4 md:border-b-0 md:border-r-4 border-gray-800 overflow-auto">
            <div className="bg-gray-900 text-white p-2 text-center sticky top-0">Host View</div>
            <div className="transform scale-[0.85] origin-top">
              <GameRoom roomCode={roomCode} isHost={true} username="Host" onLeaveRoom={handleLeaveRoom} />
            </div>
          </div>

          {/* Player POV */}
          <div className="flex-1 overflow-auto">
            <div className="bg-gray-900 text-white p-2 text-center sticky top-0">Player View</div>
            <div className="transform scale-[0.85] origin-top">
              <GameRoom roomCode={roomCode} isHost={false} username="Player" onLeaveRoom={handleLeaveRoom} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 text-white p-2 text-center">
          <p>
            Room Code: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{roomCode}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <GameRoom roomCode={roomCode} isHost={isHost} username={username || "Guest"} onLeaveRoom={handleLeaveRoom} />
    </div>
  )
}

export default App