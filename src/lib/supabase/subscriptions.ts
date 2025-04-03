
import { supabase } from './client';
import { Game } from '@/types/game';

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
