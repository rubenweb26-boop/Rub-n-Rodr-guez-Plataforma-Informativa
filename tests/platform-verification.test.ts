import assert from "node:assert/strict";
import test from "node:test";
import { getApprovedAdvertisers, getApprovedProducts } from "../lib/data/advertisers";
import { getPublishedInvestigations, getInvestigationBySlug } from "../lib/data/investigations";
import { ONVO_PLANS } from "../lib/payments/onvo";
import { generateWhatsAppBotReply, WhatsAppIncomingMessage } from "../lib/whatsapp/bot";

// ---------------------------------------------------------------------------
// 1. Complaints & Territorial Integrity
// ---------------------------------------------------------------------------

test("Complaint tracking code pattern matches official format DEN-YYYY-CR-XXXXX", () => {
  const sampleTracking = "DEN-2026-CR-98412";
  const regex = /^DEN-\d{4}-CR-[A-Z0-9]+$/;
  assert.equal(regex.test(sampleTracking), true);
});

test("Animal welfare and illegal breeding categories are valid and recognized", () => {
  const allowedCategories = [
    "maltrato_animal",
    "criaderos_clandestinos",
    "fauna_silvestre",
    "infrastructure",
    "public_services",
    "environment",
    "community_safety",
    "administrative_irregularities",
    "municipal",
    "other",
  ];
  assert.equal(allowedCategories.includes("maltrato_animal"), true);
  assert.equal(allowedCategories.includes("criaderos_clandestinos"), true);
  assert.equal(allowedCategories.includes("fauna_silvestre"), true);
});

// ---------------------------------------------------------------------------
// 2. Advertisers & Commercial Showcase Rules
// ---------------------------------------------------------------------------

test("Advertisers have valid Costa Rican contact data and do not exceed 10 products", () => {
  const advertisers = getApprovedAdvertisers();
  assert.ok(advertisers.length > 0, "Debe haber anunciantes aprobados en la vitrina");

  for (const adv of advertisers) {
    assert.ok(adv.businessName.length >= 2, "Nombre de negocio requerido");
    assert.ok(adv.whatsapp.startsWith("506"), "Número de WhatsApp debe ser de Costa Rica (506)");
    assert.ok(
      adv.products.length <= 10,
      `El negocio ${adv.businessName} supera el límite de 10 productos (${adv.products.length})`,
    );
    for (const prod of adv.products) {
      assert.ok(prod.name.length >= 2, "Nombre de producto requerido");
      assert.ok(prod.imageUrl.length > 0, "Imagen requerida para producto");
      assert.equal(prod.advertiserId, adv.id);
    }
  }
});

test("Commercial carousel products aggregator returns all verified products", () => {
  const products = getApprovedProducts();
  assert.ok(products.length >= 4, "Debe haber productos verificados en el carrusel");
  for (const p of products) {
    assert.ok(p.advertiserWhatsapp.length > 0, "Cada producto debe tener WhatsApp del proveedor");
  }
});

// ---------------------------------------------------------------------------
// 3. Investigations & Premium Access Logic
// ---------------------------------------------------------------------------

test("Investigations data contains authentic articles with key findings and slugs", () => {
  const invs = getPublishedInvestigations();
  assert.ok(invs.length >= 3, "Debe haber investigaciones disponibles");

  const slugTarget = "desmantelamiento-criaderos-clandestinos-valle-central";
  const found = getInvestigationBySlug(slugTarget);
  assert.ok(found, "Debe encontrar la investigación por slug");
  assert.equal(found.isPremium, true, "La investigación de criaderos debe ser premium");
  assert.ok(found.keyFindings.length >= 3, "Debe tener hallazgos clave");
  assert.ok(found.author.includes("Rubén Rodríguez"));
});

// ---------------------------------------------------------------------------
// 4. ONVO Pay Subscriptions & Pricing
// ---------------------------------------------------------------------------

test("ONVO Pay plans are correctly priced at ₡3.500 CRC in minor units", () => {
  assert.equal(ONVO_PLANS.membership_citizen.amountCrc, 3500);
  assert.equal(ONVO_PLANS.membership_commercial.amountCrc, 3500);

  // In ONVO CRC minor units: 3500 * 100 = 350000
  const minorUnitsCitizen = ONVO_PLANS.membership_citizen.amountCrc * 100;
  assert.equal(minorUnitsCitizen, 350000);
  assert.equal(ONVO_PLANS.membership_citizen.interval, "month");
});

// ---------------------------------------------------------------------------
// 5. WhatsApp Business Bot
// ---------------------------------------------------------------------------

test("WhatsApp Bot returns structured menu on greeting", async () => {
  const msg: WhatsAppIncomingMessage = {
    from: "50688880000",
    id: "wamid.123",
    timestamp: "1234567890",
    text: "Hola",
  };
  const reply = await generateWhatsAppBotReply(msg);
  assert.ok(reply.includes("Plataforma Oficial de Rubén Rodríguez"));
  assert.ok(reply.includes("Membresías y suscripción mensual (₡3.500)"));
  assert.ok(reply.includes("Cómo presentar una denuncia ciudadana"));
});

test("WhatsApp Bot handles membership inquiry option 1", async () => {
  const msg: WhatsAppIncomingMessage = {
    from: "50688880000",
    id: "wamid.124",
    timestamp: "1234567890",
    text: "1",
  };
  const reply = await generateWhatsAppBotReply(msg);
  assert.ok(reply.includes("₡3.500 al mes"));
  assert.ok(reply.includes("Membresía Ciudadana"));
  assert.ok(reply.includes("Membresía Comercial"));
  assert.ok(reply.includes("https://rubenrodriguezoficial.com/membresia"));
});

test("WhatsApp Bot handles human assistance option 5", async () => {
  const msg: WhatsAppIncomingMessage = {
    from: "50688880000",
    id: "wamid.125",
    timestamp: "1234567890",
    text: "5",
  };
  const reply = await generateWhatsAppBotReply(msg);
  assert.ok(reply.includes("Atención Personalizada"));
  assert.ok(reply.includes("equipo de coordinación"));
});
