
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

// Clue status functions - now storing in the game object directly
export const updateClueStatus = async (
  gameId: string,
  roundNumber: number,
  playerId: string,
  status: 'unique' | 'duplicate'
) => {
  try {
    // Get the current game
    const game = await getGameById(gameId);
    if (!game) {
      console.error('Game not found when trying to update clue status');
      return false;
    }
    
    // Update clue_statuses map if it doesn't exist yet
    if (!game.clue_statuses) {
      game.clue_statuses = {};
    }
    
    // Create a round key
    const roundKey = `round_${roundNumber}`;
    if (!game.clue_statuses[roundKey]) {
      game.clue_statuses[roundKey] = {};
    }
    
    // Update the player's status
    game.clue_statuses[roundKey][playerId] = status;
    
    // Save back to database
    const updatedGame = await updateGameInDb(game);
    
    console.log('Clue status updated for player:', playerId, status);
    return !!updatedGame;
  } catch (err) {
    console.error('Exception updating clue status:', err);
    return false;
  }
};

export const getClueStatuses = async (gameId: string, roundNumber: number) => {
  try {
    const game = await getGameById(gameId);
    if (!game || !game.clue_statuses) {
      return [];
    }
    
    const roundKey = `round_${roundNumber}`;
    const roundStatuses = game.clue_statuses[roundKey] || {};
    
    // Convert to array format for compatibility with existing code
    return Object.entries(roundStatuses).map(([player_id, status]) => ({
      game_id: gameId,
      round_number: roundNumber,
      player_id,
      status,
      updated_at: new Date().toISOString()
    }));
  } catch (err) {
    console.error('Exception fetching clue statuses:', err);
    return [];
  }
};

// Function to clear clue statuses
export const clearClueStatuses = async (gameId: string, roundNumber: number) => {
  try {
    console.log(`Clearing clue statuses for game ${gameId}, round ${roundNumber}`);
    
    const game = await getGameById(gameId);
    if (!game) {
      console.error('Game not found when trying to clear clue statuses');
      return false;
    }
    
    if (game.clue_statuses) {
      const roundKey = `round_${roundNumber}`;
      if (game.clue_statuses[roundKey]) {
        delete game.clue_statuses[roundKey];
        
        // Save back to database
        const updatedGame = await updateGameInDb(game);
        console.log('Successfully cleared clue statuses');
        return !!updatedGame;
      }
    }
    
    return true; // Nothing to clear
  } catch (err) {
    console.error('Exception clearing clue statuses:', err);
    return false;
  }
};

// Add the subscribeToClueStatuses function that will listen to game updates instead
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
  
  // Create a new subscription with enhanced options - listening to games table
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
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        console.log(`Received real-time game update that may affect clue statuses:`, payload);
        // Check if the clue_statuses field has changed
        if (payload.new && payload.old && 
            JSON.stringify(payload.new.clue_statuses) !== JSON.stringify(payload.old.clue_statuses)) {
          console.log('Clue statuses have changed, triggering callback');
          callback();
        }
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
                table: 'games',
                filter: `id=eq.${gameId}`
              }, (payload) => {
                console.log(`Received real-time game update that may affect clue statuses:`, payload);
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
