const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

let db;

async function setupDatabase() {
  db = await open({
    filename: path.join(__dirname, 'game.db'),
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      green_team_name TEXT,
      red_team_name TEXT,
      current_state TEXT,
      current_team TEXT,
      winner TEXT
    );

    CREATE TABLE IF NOT EXISTS buzzer_state (
      game_id TEXT PRIMARY KEY,
      active INTEGER,
      buzzed_team TEXT,
      buzzed_player TEXT,
      buzzed_at TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT,
      username TEXT,
      team TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );
  `);

  console.log('Database setup complete');
}

const generateNumericCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

// API
app.post('/api/games', async (req, res) => {
  try {
    const { green_team_name, red_team_name } = req.body;
    const id = generateNumericCode(6);
    
    const initialState = {
      board: Array.from({ length: 7 }, () => Array(7).fill("")),
      greenScore: 0,
      redScore: 0,
      letters: generateRandomLetters(7, 7)
    };

    await db.run(
      'INSERT INTO games (id, green_team_name, red_team_name, current_state, current_team, winner) VALUES (?, ?, ?, ?, ?, ?)',
      [id, green_team_name, red_team_name, JSON.stringify(initialState), 'green', null]
    );

    await db.run(
      'INSERT INTO buzzer_state (game_id, active, buzzed_team, buzzed_player, buzzed_at) VALUES (?, ?, ?, ?, ?)',
      [id, 1, null, null, null]
    );

    res.status(201).json({ id, green_team_name, red_team_name });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await db.get('SELECT * FROM games WHERE id = ?', id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    game.current_state = JSON.parse(game.current_state);
    
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

app.put('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { current_state, current_team, winner } = req.body;
    
    await db.run(
      'UPDATE games SET current_state = ?, current_team = ?, winner = ? WHERE id = ?',
      [JSON.stringify(current_state), current_team, winner, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

app.delete('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM games WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

app.get('/api/buzzer/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const buzzerState = await db.get('SELECT * FROM buzzer_state WHERE game_id = ?', gameId);
    
    if (!buzzerState) {
      return res.status(404).json({ error: 'Buzzer state not found' });
    }
    
    res.json(buzzerState);
  } catch (error) {
    console.error('Error fetching buzzer state:', error);
    res.status(500).json({ error: 'Failed to fetch buzzer state' });
  }
});

app.put('/api/buzzer/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { active, buzzed_team, buzzed_player, buzzed_at } = req.body;
    
    await db.run(
      'UPDATE buzzer_state SET active = ?, buzzed_team = ?, buzzed_player = ?, buzzed_at = ? WHERE game_id = ?',
      [active ? 1 : 0, buzzed_team, buzzed_player, buzzed_at, gameId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating buzzer state:', error);
    res.status(500).json({ error: 'Failed to update buzzer state' });
  }
});

app.get('/api/players/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const players = await db.all('SELECT * FROM players WHERE game_id = ?', gameId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { game_id, username, team } = req.body;
    const existingPlayer = await db.get(
      'SELECT * FROM players WHERE game_id = ? AND username = ?',
      [game_id, username]
    );
    
    if (existingPlayer) {
      await db.run(
        'UPDATE players SET team = ? WHERE game_id = ? AND username = ?',
        [team, game_id, username]
      );
    } else {
      await db.run(
        'INSERT INTO players (game_id, username, team) VALUES (?, ?, ?)',
        [game_id, username, team]
      );
    }
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

function generateRandomLetters(rows, cols) {
  const ARABIC_LETTERS = "١٢٣٤٥٦٧٨٩أبتثجحخدذرزسشصضطظعغفقكلمنويھ".split("");
  const availableLetters = [...ARABIC_LETTERS];
  for (let i = availableLetters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableLetters[i], availableLetters[j]] = [availableLetters[j], availableLetters[i]];
  }

  const board = Array.from({ length: rows }, () => Array(cols).fill(""));
  let letterIndex = 0;
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      if (letterIndex >= availableLetters.length) {
        for (let i = availableLetters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableLetters[i], availableLetters[j]] = [availableLetters[j], availableLetters[i]];
        }
        letterIndex = 0;
      }
      
      board[row][col] = availableLetters[letterIndex++];
    }
  }
  
  return board;
}

const fallback = require('express-history-api-fallback');
app.use(fallback('index.html', { root: path.join(__dirname, 'dist') }));

async function startServer() {
  await setupDatabase();
  app.listen(PORT, () => {
    console.log(`${PORT} is now online.`);
  });
}

startServer().catch(console.error);