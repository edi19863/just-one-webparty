
import { createClient } from '@supabase/supabase-js';
import type { Game } from '@/types/game';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Game functions
export const getGameByCode = async (code: string) => {
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
  const { data, error } = await supabase
    .from('games')
    .insert(game)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating game:', error);
    return null;
  }
  
  return data as Game;
};

export const updateGameInDb = async (game: Game) => {
  const { data, error } = await supabase
    .from('games')
    .update(game)
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
