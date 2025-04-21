/*
  # Add room_players table for tracking players in rooms

  1. New Tables
    - `room_players`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references games.id)
      - `username` (text)
      - `team` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES games(id) ON DELETE CASCADE,
  username text NOT NULL,
  team text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room players"
  ON room_players FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert room players"
  ON room_players FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update room players"
  ON room_players FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete room players"
  ON room_players FOR DELETE
  TO public
  USING (true);