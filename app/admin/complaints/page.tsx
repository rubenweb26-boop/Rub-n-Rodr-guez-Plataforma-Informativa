import type { Metadata } from "next";
import { AdminComplaintsTable } from "@/components/admin-complaints-table";

export const metadata: Metadata = {
  title: "Gestión de Denuncias | Panel de Administración",
};

export default function AdminComplaintsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#142235]">Gestión de Denuncias</h1>
          <p className="mt-1 text-sm text-[#556377]">
            Consulte, filtre y gestione todas las denuncias registradas en la plataforma
          </p>
        </div>
      </div>

      <AdminComplaintsTable />
    </div>
  );
}