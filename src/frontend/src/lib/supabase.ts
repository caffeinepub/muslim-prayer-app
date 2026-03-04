import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ydfkfnvfcspxmjscpfrv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QOIxWQhzEOclCUtWgaHI1A_cK6t6EPK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type UserProfile = {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  prayer_method: string;
  madhab: string;
  location_name: string;
  created_at?: string;
};
