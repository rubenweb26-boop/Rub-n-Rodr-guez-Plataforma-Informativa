"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminAuthGuardProps {
  children: React.ReactNode;
  isSuperAdmin: boolean;
}

export function AdminAuthGuard({ children, isSuperAdmin }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const SUPER_ADMIN_CODE_HASH = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";

  const hashCode = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Verificar al montar
  useEffect(() => {
    const checkVerification = async () => {
      if (!isSuperAdmin) {
        setVerified(true);
        setChecking(false);
        return;
      }

      // Verificar sessionStorage
      const stored = sessionStorage.getItem("super_admin_verified");
      const storedAt = sessionStorage.getItem("super_admin_verified_at");
      
      if (stored === "true" && storedAt) {
        const verifiedAt = parseInt(storedAt, 10);
        const now = Date.now();
        // Token válido por 8 horas
        if (now - verifiedAt < 8 * 60 * 60 * 1000) {
          setVerified(true);
          setChecking(false);
          return;
        }
      }

      // No verificado o expirado - mostrar modal
      setShowModal(true);
      setChecking(false);
    };

    checkVerification();
  }, [isSuperAdmin]);

  // Cerrar modal y redirigir si intenta acceder sin verificar
  useEffect(() => {
    if (!checking && !verified && isSuperAdmin && pathname !== "/super-admin") {
      router.push("/super-admin");
    }
  }, [checking, verified, isSuperAdmin, pathname, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifying(true);

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(code.trim());
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedInput = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      if (hashedInput === SUPER_ADMIN_CODE_HASH) {
        sessionStorage.setItem("super_admin_verified", "true");
        sessionStorage.setItem("super_admin_verified_at", Date.now().toString());
        setVerified(true);
        setShowModal(false);
        setCode("");
        setError("");
      } else {
        setError("Código de acceso inválido. Inténtelo de nuevo.");
      }
    } catch {
      setError("Error al verificar el código. Inténtelo de nuevo.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    router.push("/mi-cuenta");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f8f5ef] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#d84d3d] animate-spin" />
          <p className="text-[#556377]">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  if (!verified && isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#d84d3d]/10 text-[#d84d3d]">
              <Lock className="size-8" />
            </div>
            <h2 className="text-2xl font-black text-[#142235]">Acceso Super Admin Requerido</h2>
            <p className="mt-2 text-sm text-[#556377]">
              Esta sección requiere verificación de Super Administrador.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input
                type="password"
                placeholder="Código de acceso (Rubén777)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-center text-lg tracking-widest font-mono rounded-xl border border-[#d6cfc5] bg-white focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
                maxLength={20}
                autoComplete="off"
                autoFocus
                disabled={verifying}
              />
            </div>

            <Button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-[#d84d3d] hover:bg-[#b74033] text-white font-black"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar y Acceder"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCancel}
            >
              Cancelar y volver a Mi Cuenta
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}