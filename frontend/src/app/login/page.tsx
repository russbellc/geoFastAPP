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
      setError(err instanceof Error ? err.message : "Error al autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-2">GeoIntel</h1>
        <p className="text-gray-400 mb-6">
          {isRegister ? "Crear cuenta" : "Iniciar sesion"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Cargando..." : isRegister ? "Registrarse" : "Entrar"}
          </button>
        </form>

        <p className="text-gray-500 text-sm mt-4 text-center">
          {isRegister ? "Ya tienes cuenta?" : "No tienes cuenta?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-400 hover:underline"
          >
            {isRegister ? "Iniciar sesion" : "Registrate"}
          </button>
        </p>
      </div>
    </div>
  );
}
