-- ==============================================================================
-- Migration: Enable WebSocket Realtime Broadcast for Chat System
-- ==============================================================================

-- 1. Add chats table to supabase_realtime publication
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chats'
  ) then
    alter publication supabase_realtime add table public.chats;
  end if;
end $$;

-- 2. Set replica identity to full so all chat columns (media_url, content, sender_id, etc.) 
-- are sent over the WebSocket stream
alter table public.chats replica identity full;

