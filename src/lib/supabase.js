import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hcotkzxuxdvlofhpgjrw.supabase.co";

const supabaseKey =
  "sb_publishable_BUrYQ50R6r-DdhdrjOMrkA_gkCDRRU8";

export const supabase = createClient(supabaseUrl, supabaseKey);