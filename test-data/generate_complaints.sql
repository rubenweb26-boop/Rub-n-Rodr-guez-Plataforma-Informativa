-- Script para generar 10,000 denuncias falsas en la tabla de pruebas
-- Ejecuta esto en tu SQL Editor de Supabase

INSERT INTO public.complaints (
    id, tracking_code, owner_id, category_code, province_code, canton_code, district_code, status,
    encrypted_payload, encryption_key_version, publication_authorized,
    truth_declaration_accepted, privacy_consent_accepted, urgent_channel_notice_accepted,
    created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'TC-' || md5(g::text || '-' || random()::text),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'environment',
    '1', '101', '10101',
    (ARRAY['received', 'in_review', 'closed'])[floor(random() * 3 + 1)],
    repeat(md5(g::text || random()::text), 2),
    'v1',
    true,
    true,
    true,
    true,
    NOW() - (random() * interval '365 days'),
    NOW()
FROM generate_series(1, 10000) AS g;
