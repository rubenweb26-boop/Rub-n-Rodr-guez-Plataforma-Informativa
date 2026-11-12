"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Unlock, Loader2, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SUPER_ADMIN_CODE_HASH = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"; // SHA-256 of "Rubén777"

export function SuperAdminAccess() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const hashCode = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const hashedInput = await hashCode(code.trim());
      
      if (hashedInput === SUPER_ADMIN_CODE_HASH) {
        // Código correcto - almacenar token de verificación en sessionStorage
        sessionStorage.setItem("super_admin_verified", "true");
        sessionStorage.setItem("super_admin_verified_at", Date.now().toString());
        
        setVerified(true);
        setShowSuccess(true);
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 2000);
      } else {
        setError("Código de acceso inválido. Inténtelo de nuevo.");
      }
    } catch {
      setError("Error al verificar el código. Inténtelo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si ya está verificado en esta sesión
  if (typeof window !== "undefined" && sessionStorage.getItem("super_admin_verified") === "true") {
    // Redirigir automáticamente si ya está verificado
    return null; // El layout se encargará de la redirección
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#d84d3d]/10 text-[#d84d3d]">
            <Shield className="size-8" />
          </div>
          <CardTitle className="text-2xl font-black text-[#142235]">Acceso Super Admin</CardTitle>
          <p className="text-sm text-[#556377] mt-1">
            Ingrese el código de acceso para habilitar funciones de super administración
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSuccess && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Acceso concedido. Redirigiendo al panel de administración...</AlertDescription>
            </Alert>
          )}

          {!showSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-rose-200 bg-rose-50 text-rose-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                <Input
                  type="password"
                  placeholder="Código de acceso (Rubén777)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-10 text-center text-lg tracking-widest font-mono"
                  maxLength={20}
                  autoComplete="off"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#d84d3d] hover:bg-[#b74033] text-white font-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Verificar y Acceder
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-[#ded8ce]">
            <p className="text-xs text-center text-[#8ea4be]">
              <Link href="/mi-cuenta" className="text-[#d84d3d] hover:underline">
                ← Volver a Mi Cuenta
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}