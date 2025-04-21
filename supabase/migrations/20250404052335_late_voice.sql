/*
  # Game Database Schema

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `current_state` (jsonb) - Stores the game board state
      - `current_team` (text) - Current team's turn ('red' or 'green')
      - `winner` (text) - Winning team (null if game ongoing)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `buzzer_state`
      - `game_id` (uuid, foreign key)
      - `active` (boolean) - Whether buzzer is active
      - `buzzed_team` (text) - Team that buzzed ('red' or 'green')
      - `buzzed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_state jsonb NOT NULL DEFAULT '{
    "board": [],
    "greenScore": 0,
    "redScore": 0
  }',
  current_team text NOT NULL DEFAULT 'green',
  winner text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create buzzer_state table
CREATE TABLE IF NOT EXISTS buzzer_state (
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  buzzed_team text,
  buzzed_at timestamptz,
  PRIMARY KEY (game_id)
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzer_state ENABLE ROW LEVEL SECURITY;

-- Policies for games table
CREATE POLICY "Anyone can view games"
  ON games FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert games"
  ON games FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update games"
  ON games FOR UPDATE
  TO public
  USING (true);

-- Policies for buzzer_state table
CREATE POLICY "Anyone can view buzzer state"
  ON buzzer_state FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert buzzer state"
  ON buzzer_state FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update buzzer state"
  ON buzzer_state FOR UPDATE
  TO public
  USING (true);