declare namespace Cloudflare {
  interface Env {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_SECRET_KEY?: string;
    /** Legacy Supabase projects may still expose this name. Prefer SUPABASE_SECRET_KEY. */
    SUPABASE_SERVICE_ROLE_KEY?: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    TURNSTILE_EXPECTED_HOSTNAME?: string;
    DATA_ENCRYPTION_KEY_V1?: string;
    DATA_ENCRYPTION_KEY_V2?: string;
    DATA_ENCRYPTION_KEY_VERSION?: string;
    AUDIT_HMAC_KEY?: string;
    RATE_LIMIT_HMAC_KEY?: string;
    TILOPAY_PAYMENTS_ENABLED?: string;
    TILOPAY_API_USER?: string;
    TILOPAY_API_PASSWORD?: string;
    TILOPAY_API_KEY?: string;
    TILOPAY_MERCHANT_ID?: string;
    TILOPAY_API_BASE_URL?: string;
    TILOPAY_CALLBACK_URL?: string;
    COMPLAINT_INTAKE_ENABLED?: string;
  }
}
