ALTER TABLE profiles ALTER COLUMN user_dashboard SET DEFAULT true;
UPDATE profiles SET user_dashboard = true WHERE user_dashboard = false;