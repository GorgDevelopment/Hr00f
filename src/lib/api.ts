import axios from "axios"
import { 
  generateRandomLetters as generateRandomLettersLocal,
  createGame as createGameLocal,
  getGame as getGameLocal,
  updateGame as updateGameLocal,
  deleteGame as deleteGameLocal,
  getBuzzerState as getBuzzerStateLocal,
  updateBuzzerState as updateBuzzerStateLocal,
  getPlayers as getPlayersLocal,
  addPlayer as addPlayerLocal,
  saveUserSession as saveUserSessionLocal,
  getUserSession as getUserSessionLocal,
  clearUserSession as clearUserSessionLocal,
  type UserSession
} from "./localDatabase"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://7rof.xyz:3001/api"

// Use local implementation instead of API calls
export const createGame = createGameLocal;
export const getGame = getGameLocal;
export const updateGame = updateGameLocal;
export const deleteGame = deleteGameLocal;
export const getBuzzerState = getBuzzerStateLocal;
export const updateBuzzerState = updateBuzzerStateLocal;
export const getPlayers = getPlayersLocal;
export const addPlayer = addPlayerLocal;
export const generateRandomLetters = generateRandomLettersLocal;
export const saveUserSession = saveUserSessionLocal;
export const getUserSession = getUserSessionLocal;
export const clearUserSession = clearUserSessionLocal;
export type { UserSession };

// Keep original API implementations commented out for reference
/*
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
*/