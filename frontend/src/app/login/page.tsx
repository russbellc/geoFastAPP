"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de autenticacion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-tertiary/5 blur-[100px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <span
              className="material-symbols-outlined text-on-primary-fixed text-2xl"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              explore
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-on-surface tracking-tighter font-headline">
              GeoIntel
            </h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              Centro de Inteligencia
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-container-low rounded-3xl p-8 shadow-2xl border border-outline-variant/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-xl font-headline font-bold text-on-surface mb-1">
              {isRegister ? "Crear Cuenta" : "Bienvenido"}
            </h2>
            <p className="text-on-surface-variant text-sm mb-8">
              {isRegister ? "Registrate para comenzar a escanear territorios" : "Inicia sesion en tu panel de inteligencia"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Juan Perez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                  Correo
                </label>
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                  Contrasena
                </label>
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-on-primary-fixed py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-primary-container/20 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Procesando...
                  </>
                ) : isRegister ? (
                  <>
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Crear Cuenta
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">login</span>
                    Iniciar Sesion
                  </>
                )}
              </button>
            </form>

            <p className="text-on-surface-variant text-sm mt-6 text-center">
              {isRegister ? "Ya tienes una cuenta?" : "No tienes una cuenta?"}{" "}
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-primary font-bold hover:underline"
              >
                {isRegister ? "Iniciar Sesion" : "Registrarse"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
