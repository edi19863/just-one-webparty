
import { createClient } from '@supabase/supabase-js';
import type { Game } from '@/types/game';

const supabaseUrl = 'https://tqvnpmhfavjiqxplutwk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdm5wbWhmYXZqaXF4cGx1dHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NjAzOTAsImV4cCI6MjA1OTAzNjM5MH0.7cLrQfVWwIw_p0V4xfZDG7MZCQpDyov-Qz_5cNCmD_Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a session for anonymous access if needed
const ensureSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Create anonymous session
    await supabase.auth.signInAnonymously();
  }
};

// Game functions
export const getGameByCode = async (code: string) => {
  await ensureSession();
  
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();
  
  if (error) {
    console.error('Error fetching game:', error);
    return null;
  }
  
  return data as Game;
};

export const getGameById = async (id: string) => {
  await ensureSession();
  
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
};

export const createGameInDb = async (game: Game) => {
  await ensureSession();
  
  // Use the current timestamp for created_at and updated_at
  const gameToCreate = {
    ...game,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

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
};

export const updateGameInDb = async (game: Game) => {
  await ensureSession();
  
  // Always update the updated_at timestamp
  const gameToUpdate = {
    ...game,
    updated_at: new Date().toISOString()
  };

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
};

// Real-time subscription
export const subscribeToGame = (gameId: string, callback: (game: Game) => void) => {
  return supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        callback(payload.new as Game);
      }
    )
    .subscribe();
};
