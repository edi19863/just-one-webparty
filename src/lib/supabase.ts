
import { createClient } from '@supabase/supabase-js';
import type { Game } from '@/types/game';

const supabaseUrl = 'https://tqvnpmhfavjiqxplutwk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdm5wbWhmYXZqaXF4cGx1dHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NjAzOTAsImV4cCI6MjA1OTAzNjM5MH0.7cLrQfVWwIw_p0V4xfZDG7MZCQpDyov-Qz_5cNCmD_Y';

// Create the Supabase client with auth disabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist the session to avoid auth issues
    autoRefreshToken: false, // Don't auto refresh tokens
  },
  global: {
    headers: {
      'x-app-role': 'app_user', // This header is meant to bypass RLS but might not work without proper policies
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

// Improved real-time subscription with proper channel management
export const subscribeToGame = (gameId: string, callback: (game: Game) => void) => {
  // Create a unique channel name for this game
  const channelName = `game-updates:${gameId}`;
  
  console.log(`Setting up subscription for game ${gameId} on channel ${channelName}`);
  
  // Subscribe to changes on the games table for this specific game ID
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
        console.log('Received real-time update:', payload);
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          callback(payload.new as Game);
        }
      }
    )
    .subscribe((status) => {
      console.log(`Supabase subscription status for ${channelName}: ${status}`);
    });
  
  return channel;
};
