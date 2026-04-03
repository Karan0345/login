const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the backend runtime."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});

const normalizeRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    _id: row.id
  };
};

const users = {
  async insert(payload) {
    const { data, error } = await supabase.from("users").insert(payload).select().single();
    if (error) {
      if (error.code === "23505") {
        const duplicateError = new Error(error.message);
        duplicateError.errorType = "uniqueViolated";
        throw duplicateError;
      }
      throw error;
    }
    return normalizeRow(data);
  },
  async findOne(query) {
    const queryEntries = Object.entries(query || {});
    let req = supabase.from("users").select("*").limit(1);
    for (const [key, value] of queryEntries) {
      req = req.eq(key, value);
    }
    const { data, error } = await req.maybeSingle();
    if (error) throw error;
    return normalizeRow(data);
  }
};

const loginAttempts = {
  async insert(payload) {
    const { data, error } = await supabase.from("login_attempts").insert(payload).select().single();
    if (error) throw error;
    return normalizeRow(data);
  }
};

module.exports = { users, loginAttempts };
