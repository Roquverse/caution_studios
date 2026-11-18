import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { verifyAdminRequest } from '../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

function extractProducerNameFromContent(content: string): string | null {
  if (!content) return null;
  const match = content.match(/CONGRATULATIONS\s+([A-Za-z0-9\s._'-]+?)[!]/i);
  if (match && match[1]) {
    const cleaned = match[1].trim();
    if (cleaned && cleaned.toLowerCase() !== 'producer') {
      return cleaned;
    }
  }
  return null;
}

// GET /api/chat - Fetch all chat threads with fully resolved producer profiles (WhatsApp style)
export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();
    const adminUserId = authCheck.user?.id || 'c855e1b8-b34c-4b1d-986b-373e70ec423f';

    // 1. Fetch active admin IDs from admin_users
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);
    
    const adminIds = new Set<string>((adminUsers || []).map((a) => a.user_id).filter(Boolean));
    adminIds.add('c855e1b8-b34c-4b1d-986b-373e70ec423f');
    adminIds.add('9db03bfb-2dc1-42dd-888c-32daa24fe93a');
    adminIds.add(adminUserId);
    // Ensure producer Cole is never treated as admin in thread counterpart grouping
    adminIds.delete('64d47dcb-3d1f-41dd-8400-46f39c5b0750');

    // 2. Fetch all chats ordered chronologically
    const { data: chatsData, error: chatsErr } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: true });

    if (chatsErr) {
      return NextResponse.json({ error: chatsErr.message }, { status: 500 });
    }

    if (!chatsData || chatsData.length === 0) {
      return NextResponse.json({ threads: [], adminUserId });
    }

    // 3. Collect participant IDs (excluding known admin IDs)
    const participantIds = new Set<string>();
    chatsData.forEach((c) => {
      if (c.sender_id) participantIds.add(c.sender_id);
      if (c.recipient_id) participantIds.add(c.recipient_id);
    });

    // 4. Fetch profiles for all participants
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, handle, avatar_url, primary_role, roles')
      .in('id', Array.from(participantIds));

    const profileMap = new Map<string, any>();
    (profilesData || []).forEach((p) => profileMap.set(p.id, p));

    // 5. Fetch auth users to get emails and metadata
    let emailMap: Record<string, { email: string; name?: string }> = {};
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      (authUsers?.users || []).forEach((u) => {
        if (u.id) {
          const metaName = u.user_metadata?.name || u.user_metadata?.full_name || u.user_metadata?.display_name;
          emailMap[u.id] = { email: u.email || '', name: metaName };
        }
      });
    } catch (e) {
      console.warn('Could not list auth users in /api/chat:', e);
    }

    // 6. Fetch producer beats to attach catalog count and latest beat
    const { data: beatsData } = await supabase
      .from('beats')
      .select('id, title, cover_url, producer_id, created_at')
      .in('producer_id', Array.from(participantIds))
      .order('created_at', { ascending: false });

    const beatsMap = new Map<string, { count: number; latestBeat?: string; coverUrl?: string }>();
    (beatsData || []).forEach((b) => {
      if (!b.producer_id) return;
      const cur = beatsMap.get(b.producer_id) || { count: 0 };
      cur.count += 1;
      if (!cur.latestBeat) cur.latestBeat = b.title;
      if (!cur.coverUrl && b.cover_url) cur.coverUrl = b.cover_url;
      beatsMap.set(b.producer_id, cur);
    });

    // 7. Group chats by producer counterpart
    const threadMap = new Map<string, any[]>();
    chatsData.forEach((msg) => {
      let producerId: string | null = null;

      // Case A: Sales notification or self-message (sender_id == recipient_id)
      if (msg.sender_id === msg.recipient_id) {
        producerId = msg.sender_id;
      }
      // Case B: Sent by admin to a producer
      else if (adminIds.has(msg.sender_id)) {
        producerId = msg.recipient_id;
      }
      // Case C: Sent by producer to admin
      else if (adminIds.has(msg.recipient_id)) {
        producerId = msg.sender_id;
      }
      // Case D: General counterpart
      else {
        producerId = msg.sender_id === adminUserId ? msg.recipient_id : msg.sender_id;
      }

      if (!producerId) return;

      if (!threadMap.has(producerId)) {
        threadMap.set(producerId, []);
      }
      threadMap.get(producerId)!.push(msg);
    });

    // 8. Build formatted threads
    const threads: any[] = [];
    threadMap.forEach((msgs, pId) => {
      const prof = profileMap.get(pId);
      const authInfo = emailMap[pId];
      const beatsInfo = beatsMap.get(pId) || { count: 0 };

      // Determine best display name
      let resolvedName = prof?.display_name?.trim();

      // If display name is missing or generic 'Producer'/'User'
      if (!resolvedName || resolvedName.toLowerCase() === 'producer' || resolvedName.toLowerCase() === 'user') {
        // Try extracting from any purchase notifications in the thread
        for (const m of msgs) {
          const extracted = extractProducerNameFromContent(m.content);
          if (extracted) {
            resolvedName = extracted;
            break;
          }
        }
      }

      // If still missing, check auth user metadata
      if (!resolvedName || resolvedName.toLowerCase() === 'producer') {
        if (authInfo?.name) {
          resolvedName = authInfo.name;
        } else if (prof?.handle) {
          resolvedName = prof.handle;
        } else if (authInfo?.email) {
          resolvedName = authInfo.email.split('@')[0];
        } else {
          resolvedName = `Producer (${pId.slice(0, 5)})`;
        }
      }

      // Handle
      let resolvedHandle = prof?.handle
        ? `@${prof.handle.replace(/^@/, '')}`
        : authInfo?.email
        ? `@${authInfo.email.split('@')[0]}`
        : null;

      if (!resolvedHandle || resolvedHandle === '@creator' || resolvedHandle === '@producer') {
        if (resolvedName && resolvedName.toLowerCase() !== 'producer' && !resolvedName.startsWith('Producer (')) {
          resolvedHandle = `@${resolvedName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
        } else {
          resolvedHandle = '@producer';
        }
      }

      // Avatar
      const resolvedAvatar = prof?.avatar_url || beatsInfo.coverUrl || '';

      const lastMsg = msgs[msgs.length - 1];
      const lastDate = new Date(lastMsg.created_at);
      const timeStr = lastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let previewText = lastMsg.content || '';
      if (lastMsg.media_type === 'image') previewText = '📷 [Image attachment]';
      else if (lastMsg.media_type === 'audio') previewText = '🎵 [Audio message]';

      threads.push({
        producerId: pId,
        displayName: resolvedName,
        handle: resolvedHandle,
        avatarUrl: resolvedAvatar,
        email: authInfo?.email || '',
        beatsCount: beatsInfo.count,
        latestBeat: beatsInfo.latestBeat || '',
        lastMessage: previewText,
        lastMessageTime: timeStr,
        lastTimestamp: lastDate.getTime(),
        unreadCount: 0,
        messages: msgs
      });
    });

    // Sort by most recent message first (WhatsApp style)
    threads.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    return NextResponse.json({
      threads,
      adminUserId
    });
  } catch (err: any) {
    console.error('Error in GET /api/chat:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/chat - Admin sends a message or media to a producer
export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.isAdmin) {
      return authCheck.errorResponse!;
    }

    const supabase = getServiceRoleClient();
    const adminUserId = authCheck.user?.id || 'c855e1b8-b34c-4b1d-986b-373e70ec423f';

    const body = await req.json();
    const {
      recipientId,
      content,
      mediaUrl,
      mediaKey,
      mediaType,
      mediaName,
      mediaSize,
      mediaDuration
    } = body;

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId is required' }, { status: 400 });
    }

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Message content or media attachment is required' }, { status: 400 });
    }

    const { data: newMsg, error: insertErr } = await supabase
      .from('chats')
      .insert({
        sender_id: adminUserId,
        recipient_id: recipientId,
        content: content ? content.trim() : null,
        media_url: mediaUrl || null,
        media_key: mediaKey || null,
        media_type: mediaType || null,
        media_name: mediaName || null,
        media_size: mediaSize || null,
        media_duration: mediaDuration || null,
        is_encrypted: false,
        has_contact_info: false
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error('Admin send message error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ message: newMsg });
  } catch (err: any) {
    console.error('Error in POST /api/chat:', err);
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}

