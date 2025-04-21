import axios from "axios"
import { generateRandomLetters as generateRandomLettersLocal } from "./localDatabase"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://7rof.xyz:3001/api"

export const createGame = async (greenTeamName: string, redTeamName: string) => {
  const response = await axios.post(`${API_BASE_URL}/games`, {
    green_team_name: greenTeamName,
    red_team_name: redTeamName,
  })
  return response.data
}

export const getGame = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/games/${id}`)
  return response.data
}

export const updateGame = async (id: string, updates: any) => {
  const response = await axios.put(`${API_BASE_URL}/games/${id}`, updates)
  return response.data
}

export const deleteGame = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/games/${id}`)
  return response.data
}

// Buzzer API
export const getBuzzerState = async (gameId: string) => {
  const response = await axios.get(`${API_BASE_URL}/buzzer/${gameId}`)
  return response.data
}

export const updateBuzzerState = async (gameId: string, updates: any) => {
  const response = await axios.put(`${API_BASE_URL}/buzzer/${gameId}`, updates)
  return response.data
}

// Players API
export const getPlayers = async (gameId: string) => {
  const response = await axios.get(`${API_BASE_URL}/players/${gameId}`)
  return response.data
}

export const addPlayer = async (gameId: string, username: string, team: "red" | "green") => {
  const response = await axios.post(`${API_BASE_URL}/players`, {
    game_id: gameId,
    username,
    team,
  })
  return response.data
}

export const generateRandomLetters = generateRandomLettersLocal

// Session management (still using localStorage for user session)
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