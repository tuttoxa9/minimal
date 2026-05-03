CREATE TYPE lead_status AS ENUM ('Новая', 'В работе', 'Успешно закрыта', 'Повторная связь', 'Отказ');

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  comment text,
  status lead_status DEFAULT 'Новая',
  scheduled_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamp with time zone DEFAULT now()
);
