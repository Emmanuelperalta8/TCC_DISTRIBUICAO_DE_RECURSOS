import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dskbpsagetommnoylcwu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRza2Jwc2FnZXRvbW1ub3lsY3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDk4OTAsImV4cCI6MjA5MDkyNTg5MH0.VI6BrP_kDixZbELqC9kEtuMpRxMjYZbOdOXMChxn4gE'

export const supabase = createClient(supabaseUrl, supabaseKey)