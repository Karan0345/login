const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the backend runtime."
  );
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch (_err) {
    return null;
  }
}

const keyPayload = decodeJwtPayload(supabaseServiceRoleKey);
const keyRole = keyPayload?.role || "unknown";
if (keyRole !== "service_role") {
  throw new Error(
    `Invalid backend key role: ${keyRole}. Set SUPABASE_SERVICE_ROLE_KEY (service_role), not publishable/anon key.`
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

function isUniqueViolation(error) {
  const code = String(error?.code ?? "");
  const msg = String(error?.message ?? "");
  return code === "23505" || /duplicate key|unique constraint/i.test(msg);
}

const users = {
  async insert(payload) {
    const { data, error } = await supabase.from("users").insert(payload).select("*");
    if (error) {
      if (isUniqueViolation(error)) {
        const duplicateError = new Error(error.message);
        duplicateError.errorType = "uniqueViolated";
        throw duplicateError;
      }
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error("Insert returned no row (check RLS policies or table name).");
    }
    return normalizeRow(row);
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
    const { data, error } = await supabase.from("login_attempts").insert(payload).select("*");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error("Insert returned no row (check RLS policies or table name).");
    }
    return normalizeRow(row);
  }
};

async function healthCheck() {
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) throw error;
}

function formatSupabaseError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;
  const parts = [
    error.message,
    error.code ? `code=${error.code}` : null,
    error.details,
    error.hint ? `hint=${error.hint}` : null
  ].filter(Boolean);
  if (parts.length) return parts.join(" | ");
  try {
    return JSON.stringify(error);
  } catch (_e) {
    return String(error);
  }
}

module.exports = {
  users,
  loginAttempts,
  healthCheck,
  diagnostics: { keyRole, hasUrl: Boolean(supabaseUrl) },
  formatSupabaseError
};
