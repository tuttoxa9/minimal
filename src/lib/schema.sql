-- 1. Создаем тип статусов
CREATE TYPE lead_status AS ENUM ('Новая', 'В работе', 'Успешно закрыта', 'Повторная связь', 'Отказ');

-- 2. Создаем основную таблицу лидов
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  messenger text,
  budget text,
  goal text,
  creative text,
  offer text,
  comment text,
  status lead_status DEFAULT 'Новая',
  scheduled_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_email text,
  source text DEFAULT 'Сайт',
  market_type text,
  investment_amount numeric
);

-- 3. Создаем таблицу для заметок
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Создаем таблицу для истории изменений
CREATE TABLE history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Включаем Real-time для таблицы лидов
alter publication supabase_realtime add table leads;
