
import { createClient } from '@supabase/supabase-js';
import type { Game } from '@/types/game';

const supabaseUrl = 'https://tqvnpmhfavjiqxplutwk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdm5wbWhmYXZqaXF4cGx1dHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NjAzOTAsImV4cCI6MjA1OTAzNjM5MH0.7cLrQfVWwIw_p0V4xfZDG7MZCQpDyov-Qz_5cNCmD_Y';

// Create the Supabase client with optimized configuration for cross-browser compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist the session to avoid auth issues
    autoRefreshToken: false, // Don't auto refresh tokens
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
  // Use the current timestamp for created_at and updated_at
  const gameToCreate = {
    ...game,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('games')
      .insert(gameToCreate)
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
  // Always update the updated_at timestamp
  const gameToUpdate = {
    ...game,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('games')
      .update(gameToUpdate)
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
    if (channel.toURI().includes(gameId)) {
      console.log(`Removing existing channel: ${channel.toURI()}`);
      supabase.removeChannel(channel);
    }
  }
  
  // Create a new subscription with enhanced options
  const channel = supabase
    .channel(channelName)
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
      if (status === 'CHANNEL_ERROR') {
        console.log('Subscription error, attempting to reconnect in 2 seconds...');
        setTimeout(() => {
          console.log('Reconnecting to channel...');
          channel.unsubscribe();
          channel.subscribe();
        }, 2000);
      }
    });
  
  return channel;
};
