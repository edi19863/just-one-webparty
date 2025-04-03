
// Re-export everything from our modules
export { supabase, initializeSupabaseTables } from './client';
export { getGameByCode, getGameById, createGameInDb, updateGameInDb } from './games';
export { updateClueStatus, getClueStatuses, clearClueStatuses } from './clues';
export { subscribeToGame, subscribeToClueStatuses } from './subscriptions';
