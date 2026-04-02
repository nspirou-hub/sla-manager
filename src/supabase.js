import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://axjsewykbnvqlddxkgzn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4anNld3lrYm52cWxkZHhrZ3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjk1MDMsImV4cCI6MjA5MDY0NTUwM30.ZpL-X8p_y_0SdkJPWsS5PcmU4k694S-PPLR7nhMv03I'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
