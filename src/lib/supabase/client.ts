
import { createClient } from '@supabase/supabase-js';

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

// Initialize table structure
export const initializeSupabaseTables = async () => {
  try {
    console.log('Ensuring tables exist... (placeholder for future use)');
    // This function is a placeholder for future table creation if needed
    return true;
  } catch (err) {
    console.error('Error initializing tables:', err);
    return false;
  }
};
