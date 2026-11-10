"use client";

import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";

export function BillingPortalButton() {
  return (
    <Link
      href="/mi-cuenta"
      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#b74033] hover:underline"
    >
      <CreditCard size={14} /> Gestionar pagos y suscripción <ExternalLink size={12} />
    </Link>
  );
}
