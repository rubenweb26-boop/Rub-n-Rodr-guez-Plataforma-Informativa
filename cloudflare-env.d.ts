declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ONVO_PAYMENTS_ENABLED?: string;
    ONVO_SECRET_KEY?: string;
    ONVO_API_BASE_URL?: string;
    ONVO_WEBHOOK_SECRET?: string;
    COMPLAINT_INTAKE_ENABLED?: string;
    ADMIN_EMAILS?: string;
  }
}
