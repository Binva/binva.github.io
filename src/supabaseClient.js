import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mnzwiofzexbxddfjwtnc.supabase.co'
const supabaseKey = 'sb_publishable_aQhg7ql6ef7ZL1HbcaPYXA_Y5LEtJ_X'

export const supabase = createClient(supabaseUrl, supabaseKey)
