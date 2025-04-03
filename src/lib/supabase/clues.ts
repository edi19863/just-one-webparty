
import { getGameById, updateGameInDb } from './games';

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
