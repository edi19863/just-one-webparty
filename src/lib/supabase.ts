import { createClient } from '@supabase/supabase-js';
import { Game, ClueStatus } from '@/types/game';
import { GameMode } from '@/types/game';

const supabaseUrl = 'https://tqvnpmhfavjiqxplutwk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdm5wbWhmYXZqaXF4cGx1dHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NjAzOTAsImV4cCI6MjA1OTAzNjM5MH0.7cLrQfVWwIw_p0V4xfZDG7MZCQpDyov-Qz_5cNCmD_Y';

// Create the Supabase client with optimized configuration for cross-browser compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist the session to avoid auth issues
    autoRefreshToken: false, // Don't auto refresh tokens
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Increase events per second for better real-time experience
    }
  }
});

// Ensure clue_statuses table exists
export const ensureClueStatusesTable = async () => {
  try {
    console.log('Ensuring clue_statuses table exists...');
    
    // Try to query the table to see if it exists
    const { error: checkError } = await supabase
      .from('clue_statuses')
      .select('count(*)')
      .limit(1)
      .single();
      
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Table does not exist, creating it...');
      
      // If the table doesn't exist, create it manually
      const { error: createError } = await supabase.rpc('create_clue_statuses_table');
      
      if (createError) {
        console.error('Error creating table via RPC:', createError);
        
        // Fall back to direct SQL (this may not work in some environments)
        const { error: sqlError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS public.clue_statuses (
            id SERIAL PRIMARY KEY,
            game_id TEXT NOT NULL,
            round_number INTEGER NOT NULL,
            player_id TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(game_id, round_number, player_id)
          );
        `);
        
        if (sqlError) {
          console.error('Error creating table via SQL:', sqlError);
          return false;
        }
      }
      
      console.log('Table created successfully');
    } else {
      console.log('Table already exists');
    }
    
    return true;
  } catch (err) {
    console.error('Exception ensuring clue_statuses table:', err);
    return false;
  }
};

// Game functions
export const getGameByCode = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error) {
      console.error('Error fetching game by code:', error);
      return null;
    }
    
    return data as Game;
  } catch (err) {
    console.error('Exception fetching game by code:', err);
    return null;
  }
};

export const getGameById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching game:', error);
      return null;
    }
    
    return data as Game;
  } catch (err) {
    console.error('Exception fetching game:', err);
    return null;
  }
};

export const createGameInDb = async (game: Game) => {
  try {
    console.log('Creating game in DB:', game);
    const { data, error } = await supabase
      .from('games')
      .insert({
        ...game,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating game:', error);
      return null;
    }
    
    return data as Game;
  } catch (err) {
    console.error('Exception creating game:', err);
    return null;
  }
};

export const updateGameInDb = async (game: Game) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .update({
        ...game,
        updated_at: new Date().toISOString()
      })
      .eq('id', game.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating game:', error);
      return null;
    }
    
    return data as Game;
  } catch (err) {
    console.error('Exception updating game:', err);
    return null;
  }
};

// Enhanced real-time subscription with better channel management and reconnection logic
export const subscribeToGame = (gameId: string, callback: (game: Game) => void) => {
  const channelName = `game-updates:${gameId}`;
  
  console.log(`Setting up enhanced subscription for game ${gameId} on channel ${channelName}`);
  
  // Clean up existing channels first
  const existingChannels = supabase.getChannels();
  for (const channel of existingChannels) {
    const channelInfo = channel as any;
    if (channelInfo?.topic && channelInfo.topic.includes(gameId)) {
      console.log(`Removing existing channel: ${channelInfo.topic}`);
      supabase.removeChannel(channel);
    }
  }
  
  // Create a new subscription with enhanced options
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: {
          self: true // Ensure client receives their own broadcasts
        },
        presence: {
          key: gameId,
        }
      }
    })
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        console.log(`Received real-time update for game ${gameId}:`, payload);
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          callback(payload.new as Game);
        }
      }
    )
    .subscribe((status, err) => {
      console.log(`Supabase subscription status for ${channelName}: ${status}`, err || '');
      
      // If subscription fails, try to reconnect
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.log('Subscription error or timeout, attempting to reconnect in 1 second...');
        setTimeout(() => {
          console.log('Reconnecting to channel...');
          try {
            channel.unsubscribe();
            channel.subscribe();
          } catch (e) {
            console.error('Error during reconnection:', e);
          }
        }, 1000);
      }
    });
  
  return channel;
};

// Add table initialization call when first loading
export const initializeSupabaseTables = async () => {
  console.log('Initializing Supabase tables...');
  const success = await ensureClueStatusesTable();
  console.log('Supabase tables initialized:', success ? 'success' : 'failed');
  return success;
};

// Clue status functions
export const updateClueStatus = async (
  gameId: string,
  roundNumber: number,
  playerId: string,
  status: 'unique' | 'duplicate'
) => {
  try {
    await ensureClueStatusesTable();
    
    const { data, error } = await supabase
      .from('clue_statuses')
      .upsert({
        game_id: gameId,
        round_number: roundNumber,
        player_id: playerId,
        status,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error updating clue status:', error);
      return false;
    }
    
    console.log('Clue status updated for player:', playerId, data);
    return true;
  } catch (err) {
    console.error('Exception updating clue status:', err);
    return false;
  }
};

export const getClueStatuses = async (gameId: string, roundNumber: number) => {
  try {
    const { data, error } = await supabase
      .from('clue_statuses')
      .select('*')
      .eq('game_id', gameId)
      .eq('round_number', roundNumber);
    
    if (error) {
      console.error('Error fetching clue statuses:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching clue statuses:', err);
    return [];
  }
};

// Function to clear clue statuses
export const clearClueStatuses = async (gameId: string, roundNumber: number) => {
  try {
    console.log(`Clearing clue statuses for game ${gameId}, round ${roundNumber}`);
    
    await ensureClueStatusesTable();
    
    const { error } = await supabase
      .from('clue_statuses')
      .delete()
      .eq('game_id', gameId)
      .eq('round_number', roundNumber);
    
    if (error) {
      console.error('Error clearing clue statuses:', error);
      return false;
    }
    
    console.log('Successfully cleared clue statuses');
    return true;
  } catch (err) {
    console.error('Exception clearing clue statuses:', err);
    return false;
  }
};

// Add the missing subscribeToClueStatuses function
export const subscribeToClueStatuses = (gameId: string, callback: () => void) => {
  const channelName = `clue-status-updates:${gameId}`;
  
  console.log(`Setting up subscription for clue statuses in game ${gameId} on channel ${channelName}`);
  
  // Clean up existing channels first
  const existingChannels = supabase.getChannels();
  for (const channel of existingChannels) {
    const channelInfo = channel as any;
    if (channelInfo?.topic && channelInfo.topic.includes(channelName)) {
      console.log(`Removing existing channel: ${channelInfo.topic}`);
      supabase.removeChannel(channel);
    }
  }
  
  // Create a new subscription with enhanced options
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: {
          self: true // Ensure client receives their own broadcasts
        },
        presence: {
          key: `${gameId}-clue-statuses`,
        }
      }
    })
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'clue_statuses',
        filter: `game_id=eq.${gameId}`
      },
      (payload) => {
        console.log(`Received real-time clue status update for game ${gameId}:`, payload);
        callback();
      }
    )
    .subscribe((status, err) => {
      console.log(`Supabase clue status subscription status for ${channelName}: ${status}`, err || '');
      
      // If subscription fails, try to reconnect
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.log('Clue status subscription error or timeout, attempting to reconnect in 1 second...');
        setTimeout(() => {
          console.log('Reconnecting to clue status channel...');
          try {
            // Create a new channel instance instead of trying to reuse the existing one
            // This avoids the "tried to subscribe multiple times" error
            supabase.removeChannel(channel);
            const newChannel = supabase.channel(channelName)
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clue_statuses',
                filter: `game_id=eq.${gameId}`
              }, (payload) => {
                console.log(`Received real-time clue status update for game ${gameId}:`, payload);
                callback();
              })
              .subscribe();
          } catch (e) {
            console.error('Error during clue status channel reconnection:', e);
          }
        }, 1000);
      }
    });
  
  return channel;
};
