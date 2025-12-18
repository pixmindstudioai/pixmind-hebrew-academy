-- OAuth Clients table for registered MCP clients
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE NOT NULL,
  client_name text NOT NULL,
  client_secret_hash text, -- Optional: for confidential clients
  redirect_uris text[] NOT NULL DEFAULT '{}',
  allowed_scopes text[] NOT NULL DEFAULT ARRAY['read', 'write'],
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- OAuth Authorization Codes (short-lived, for PKCE flow)
CREATE TABLE IF NOT EXISTS public.oauth_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  client_id text NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_role text NOT NULL DEFAULT 'student',
  redirect_uri text NOT NULL,
  scope text NOT NULL DEFAULT 'read',
  code_challenge text NOT NULL,
  code_challenge_method text NOT NULL DEFAULT 'S256',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- OAuth Tokens (for token introspection and revocation)
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_role text NOT NULL DEFAULT 'student',
  client_id text NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'read',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON public.oauth_auth_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_expires ON public.oauth_auth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON public.oauth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON public.oauth_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role (Worker) can access these tables
-- No direct user access allowed

CREATE POLICY "Service role only - oauth_clients"
ON public.oauth_clients FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role only - oauth_auth_codes"
ON public.oauth_auth_codes FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role only - oauth_tokens"
ON public.oauth_tokens FOR ALL
USING (false)
WITH CHECK (false);

-- Admin read access for oauth_clients (to manage clients)
CREATE POLICY "Admins can view oauth_clients"
ON public.oauth_clients FOR SELECT
USING (is_admin());

-- Insert a default MCP client for testing
INSERT INTO public.oauth_clients (client_id, client_name, redirect_uris, allowed_scopes)
VALUES (
  'pixmind-mcp-client',
  'PixMind MCP Client',
  ARRAY['https://claude.ai/oauth/callback', 'https://chat.openai.com/aip/g/oauth/callback', 'http://localhost:3000/callback'],
  ARRAY['read', 'write', 'admin']
) ON CONFLICT (client_id) DO NOTHING;