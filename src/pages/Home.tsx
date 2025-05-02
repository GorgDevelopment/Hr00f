import type React from "react"
import { useState } from "react"
import { Users, LogIn } from "lucide-react"
import FallingLetters from "../components/FallingLetters"
import { createGame, getGame } from "../lib/localDatabase"

interface HomeProps {
  onCreateRoom: (code: string) => void
  onJoinRoom: (code: string, username: string) => void
}

const Home: React.FC<HomeProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [joinCode, setJoinCode] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [showTeamNames, setShowTeamNames] = useState(false)
  const [greenTeamName, setGreenTeamName] = useState("Green Team")
  const [redTeamName, setRedTeamName] = useState("Red Team")
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateRoom = async () => {
    if (showTeamNames) {
      if (!greenTeamName.trim() || !redTeamName.trim()) {
        setError("الرجاء إدخال أسماء الفريقين")
        return
      }

      setIsLoading(true)
      try {
        const game = createGame(greenTeamName, redTeamName)
        if (!game || !game.id) {
          throw new Error("Failed to create game room")
        }
        onCreateRoom(game.id)
      } catch (err: any) {
        console.error("Error creating room:", err)
        setError("حدث خطأ أثناء إنشاء الغرفة. الرجاء المحاولة مرة أخرى.")
      } finally {
        setIsLoading(false)
      }
    } else {
      setShowTeamNames(true)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || !username.trim()) {
      setError("الرجاء إدخال كود الغرفة واسم المستخدم")
      return
    }

    setIsLoading(true)
    try {
      const trimmedCode = joinCode.trim()
      const game = getGame(trimmedCode)
      if (!game) {
        throw new Error("Game not found")
      }
      onJoinRoom(trimmedCode, username)
    } catch (err: any) {
      console.error("Error joining room:", err)
      setError("كود غرفة غير صالح. الرجاء المحاولة مرة أخرى.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/hexagon-pattern.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

      {/* Falling letters animation */}
      <FallingLetters />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
            Letters Competition
          </h1>
          <p className="text-gray-400">Create or join a game room to start!</p>
        </div>

        <div className="space-y-4">
          {!showTeamNames ? (
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 
                text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300
                shadow-lg shadow-purple-500/25 transform hover:scale-105 disabled:opacity-70 disabled:transform-none"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Users className="w-5 h-5" />
              )}
              <span>Create New Room</span>
            </button>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-purple-700 rounded-xl opacity-50" />
              <div className="relative bg-gray-800 p-6 rounded-xl space-y-4">
                <h3 className="text-xl font-bold text-center mb-4">Team Names</h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Green Team Name</label>
                  <input
                    type="text"
                    value={greenTeamName}
                    onChange={(e) => setGreenTeamName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Green Team"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Red Team Name</label>
                  <input
                    type="text"
                    value={redTeamName}
                    onChange={(e) => setRedTeamName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Red Team"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTeamNames(false)}
                    disabled={isLoading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-all duration-300 disabled:opacity-70"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 
                      text-white px-4 py-3 rounded-lg transition-all duration-300 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl opacity-50" />
            <div className="relative bg-gray-800 p-6 rounded-xl space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter room code"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                  text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300
                  shadow-lg shadow-blue-500/25 transform hover:scale-105 disabled:opacity-70 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                <span>Join Room</span>
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 text-center text-sm">{error}</div>}
        </div>
      </div>
    </div>
  )
}

export default Home