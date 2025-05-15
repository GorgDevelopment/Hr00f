// import { v4 as uuidv4 } from "uuid" Because fuck this shit

// Types
export interface Game {
  id: string
  green_team_name: string
  red_team_name: string
  current_state: {
    board: string[][]
    greenScore: number
    redScore: number
    letters?: string[][]
    greenConnections?: boolean
    redConnections?: boolean
  }
  current_team: "red" | "green"
  winner: "red" | "green" | null
}

export interface BuzzerState {
  game_id: string
  active: boolean
  buzzed_team: "red" | "green" | null
  buzzed_player: string | null
  buzzed_at: string | null
}

export interface Player {
  game_id: string
  username: string
  team: "red" | "green"
}

// In memory database
const db = {
  games: new Map<string, Game>(),
  buzzer_states: new Map<string, BuzzerState>(),
  players: new Map<string, Player[]>(),
}

const saveToLocalStorage = () => {
  try {
    // Convert Maps to arrays for JSON serialization
    const gamesArray = Array.from(db.games.entries())
    const buzzerStatesArray = Array.from(db.buzzer_states.entries())
    const playersArray = Array.from(db.players.entries())

    localStorage.setItem(
      "gameDb",
      JSON.stringify({
        games: gamesArray,
        buzzer_states: buzzerStatesArray,
        players: playersArray,
      }),
    )
  } catch (e) {
    console.error("Error saving to localStorage:", e)
  }
}

// Helper to load from localStorage
const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem("gameDb")
    if (data) {
      const parsed = JSON.parse(data)

      // Convert arrays back to Maps
      db.games = new Map(parsed.games)
      db.buzzer_states = new Map(parsed.buzzer_states)
      db.players = new Map(parsed.players)
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e)
  }
}

// Initialize from localStorage
try {
  loadFromLocalStorage()
} catch (e) {
  console.error("Failed to load from localStorage:", e)
}

const generateNumericCode = (length = 6): string => {
  let code = ""
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

export const generateRandomLetters = (rows: number, cols: number): string[][] => {
  const ARABIC_NUMBERS = "٣٤".split("")  
  const ARABIC_LETTERS = "أبتثجحخدذرزسشصضطعغفقكلمنهوي".split("")
  
  // Determine how many numbers to include (3-4)
  const numberCount = Math.min(2, Math.floor(Math.random() * 2) + 1)
  
  // Randomly select which numbers to use
  const shuffledNumbers = [...ARABIC_NUMBERS].sort(() => Math.random() - 0.5)
  const selectedNumbers = shuffledNumbers.slice(0, numberCount)
  
  // Create a combined pool with all letters and our selected numbers
  const allCharacters = [...ARABIC_LETTERS, ...selectedNumbers]
  
  // Shuffle the combined pool
  const shuffledCharacters = allCharacters.sort(() => Math.random() - 0.5)
  
  // Create and fill the board
  const board = Array.from({ length: rows }, () => Array(cols).fill(""))
  let charIndex = 0
  
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      // If we run out of characters, reshuffle them
      if (charIndex >= shuffledCharacters.length) {
        shuffledCharacters.sort(() => Math.random() - 0.5)
        charIndex = 0
      }
      
      board[row][col] = shuffledCharacters[charIndex++]
    }
  }

  return board
}

// Game operations
export const createGame = (greenTeamName: string, redTeamName: string): Game => {
  try {
    const id = generateNumericCode(6)
    const letters = generateRandomLetters(7, 7)

    const game: Game = {
      id,
      green_team_name: greenTeamName,
      red_team_name: redTeamName,
      current_state: {
        board: Array.from({ length: 7 }, () => Array(7).fill("")),
        greenScore: 0,
        redScore: 0,
        letters: letters,
        greenConnections: false,
        redConnections: false,
      },
      current_team: "green",
      winner: null,
    }

    db.games.set(id, game)

    // Create buzzer state
    const buzzerState: BuzzerState = {
      game_id: id,
      active: true,
      buzzed_team: null,
      buzzed_player: null,
      buzzed_at: null,
    }

    db.buzzer_states.set(id, buzzerState)
    db.players.set(id, [])

    saveToLocalStorage()
    return game
  } catch (error) {
    console.error("Error in createGame:", error)
    throw new Error("Failed to create game")
  }
}

// Get all games (for debugging)
export const getAllGames = (): Game[] => {
  return Array.from(db.games.values())
}

export const getGame = (id: string): Game | null => {
  const trimmedId = id.trim()
  const game = db.games.get(trimmedId)

  return game || null
}

// Function to check if a game exists without logging
export const gameExists = (id: string): boolean => {
  const trimmedId = id.trim()
  return db.games.has(trimmedId)
}

export const updateGame = (id: string, updates: Partial<Game>): Game | null => {
  const game = db.games.get(id)
  if (!game) return null

  const updatedGame = { ...game, ...updates }
  db.games.set(id, updatedGame)
  saveToLocalStorage()
  return updatedGame
}

export const deleteGame = (id: string): boolean => {
  const deleted = db.games.delete(id)
  db.buzzer_states.delete(id)
  db.players.delete(id)
  saveToLocalStorage()
  return deleted
}

// Buzzer operations
export const getBuzzerState = (gameId: string): BuzzerState | null => {
  return db.buzzer_states.get(gameId) || null
}

export const updateBuzzerState = (gameId: string, updates: Partial<BuzzerState>): BuzzerState | null => {
  const buzzerState = db.buzzer_states.get(gameId)
  if (!buzzerState) return null

  const updatedState = { ...buzzerState, ...updates }
  db.buzzer_states.set(gameId, updatedState)
  saveToLocalStorage()
  return updatedState
}

// Player operations
export const getPlayers = (gameId: string): Player[] => {
  return db.players.get(gameId) || []
}

export const addPlayer = (gameId: string, username: string, team: "red" | "green"): Player | null => {
  const trimmedId = gameId.trim()
  const game = db.games.get(trimmedId)
  if (!game) return null

  const players = db.players.get(trimmedId) || []

  // Check if player already exists
  const existingPlayerIndex = players.findIndex((p) => p.username === username)

  const player: Player = {
    game_id: trimmedId,
    username,
    team,
  }

  if (existingPlayerIndex >= 0) {
    // Update existing player
    players[existingPlayerIndex] = player
  } else {
    // Add new player
    players.push(player)
  }

  db.players.set(trimmedId, players)
  saveToLocalStorage()
  return player
}

// Get a player by username and game ID
export const getPlayer = (gameId: string, username: string): Player | null => {
  const players = getPlayers(gameId)
  return players.find((p) => p.username === username) || null
}

// Event system
type EventCallback = (data: any) => void
const eventListeners = new Map<string, EventCallback[]>()

export const subscribeToGameChanges = (gameId: string, callback: EventCallback): { unsubscribe: () => void } => {
  const eventKey = `game_${gameId}`
  if (!eventListeners.has(eventKey)) {
    eventListeners.set(eventKey, [])
  }

  eventListeners.get(eventKey)?.push(callback)

  return {
    unsubscribe: () => {
      const listeners = eventListeners.get(eventKey) || []
      const index = listeners.indexOf(callback)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    },
  }
}

export const subscribeToBuzzerChanges = (gameId: string, callback: EventCallback): { unsubscribe: () => void } => {
  const eventKey = `buzzer_${gameId}`
  if (!eventListeners.has(eventKey)) {
    eventListeners.set(eventKey, [])
  }

  eventListeners.get(eventKey)?.push(callback)

  return {
    unsubscribe: () => {
      const listeners = eventListeners.get(eventKey) || []
      const index = listeners.indexOf(callback)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    },
  }
}

export const subscribeToPlayerChanges = (gameId: string, callback: EventCallback): { unsubscribe: () => void } => {
  const eventKey = `players_${gameId}`
  if (!eventListeners.has(eventKey)) {
    eventListeners.set(eventKey, [])
  }

  eventListeners.get(eventKey)?.push(callback)

  return {
    unsubscribe: () => {
      const listeners = eventListeners.get(eventKey) || []
      const index = listeners.indexOf(callback)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    },
  }
}

// Helper to trigger events
const triggerEvent = (eventKey: string, data: any) => {
  const listeners = eventListeners.get(eventKey) || []
  listeners.forEach((callback) => {
    try {
      callback(data)
    } catch (e) {
      console.error("Error in event listener:", e)
    }
  })
}

// Override to trigger events
const originalUpdateGame = updateGame
export const updateGameWithEvents = (id: string, updates: Partial<Game>): Game | null => {
  const result = originalUpdateGame(id, updates)
  if (result) {
    triggerEvent(`game_${id}`, { new: result })
  }
  return result
}

const originalUpdateBuzzerState = updateBuzzerState
export const updateBuzzerStateWithEvents = (gameId: string, updates: Partial<BuzzerState>): BuzzerState | null => {
  const result = originalUpdateBuzzerState(gameId, updates)
  if (result) {
    triggerEvent(`buzzer_${gameId}`, { new: result })
  }
  return result
}

const originalAddPlayer = addPlayer
export const addPlayerWithEvents = (gameId: string, username: string, team: "red" | "green"): Player | null => {
  const result = originalAddPlayer(gameId, username, team)
  if (result) {
    triggerEvent(`players_${gameId}`, { new: result })
  }
  return result
}

// Session management
export interface UserSession {
  roomCode: string
  username: string
  isHost: boolean
  team?: "red" | "green" | null
}

export const saveUserSession = (session: UserSession): void => {
  localStorage.setItem("userSession", JSON.stringify(session))
}

export const getUserSession = (): UserSession | null => {
  const sessionData = localStorage.getItem("userSession")
  if (!sessionData) return null

  try {
    return JSON.parse(sessionData)
  } catch (e) {
    console.error("Error parsing user session:", e)
    return null
  }
}

export const clearUserSession = (): void => {
  localStorage.removeItem("userSession")
}