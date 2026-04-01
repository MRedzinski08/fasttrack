-- FastTrack Database Schema

CREATE TABLE IF NOT EXISTS user_profiles (
  id                  SERIAL PRIMARY KEY,
  firebase_uid        VARCHAR(128) UNIQUE NOT NULL,
  email               VARCHAR(255),
  display_name        VARCHAR(100),
  daily_calorie_goal  INTEGER DEFAULT 2000,
  fasting_protocol    VARCHAR(20) DEFAULT '16:8',
  fasting_hours       INTEGER DEFAULT 16,
  eating_hours        INTEGER DEFAULT 8,
  timezone            VARCHAR(50) DEFAULT 'America/New_York',
  current_weight      DECIMAL(5,1),
  goal_weight         DECIMAL(5,1),
  height_inches       INTEGER,
  age                 INTEGER,
  sex                 VARCHAR(10),
  activity_level      VARCHAR(20) DEFAULT 'moderate',
  weekly_loss_goal    DECIMAL(3,1) DEFAULT 1.0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  ai_summary_date     DATE,
  ai_summary_text     TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
  food_name    VARCHAR(255) NOT NULL,
  calories     INTEGER NOT NULL,
  protein_g    DECIMAL(6,1),
  carbs_g      DECIMAL(6,1),
  fat_g        DECIMAL(6,1),
  quantity     DECIMAL(6,2) DEFAULT 1,
  unit         VARCHAR(50),
  eaten_at     TIMESTAMP DEFAULT NOW(),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fasting_sessions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
  fast_start     TIMESTAMP NOT NULL,
  fast_end       TIMESTAMP,
  target_hours   INTEGER NOT NULL,
  completed      BOOLEAN DEFAULT FALSE,
  broken_early   BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
  exercise_name   VARCHAR(255) NOT NULL,
  met_value       DECIMAL(4,1) NOT NULL,
  duration_min    INTEGER NOT NULL,
  calories_burned INTEGER NOT NULL,
  logged_at       TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_eaten_at ON meal_logs(eaten_at);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user_id ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_fast_end ON fasting_sessions(fast_end);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_id ON exercise_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_logged_at ON exercise_logs(logged_at);
