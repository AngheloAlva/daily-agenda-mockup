"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RiLoader4Line } from "@remixicon/react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Maqueta: sin validación real, solo redirige
    setTimeout(() => router.push("/dashboard"), 400);
  };

  return (
    <div className="from-primary/10 via-background to-background relative flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br p-4">
      {/* Decoración de fondo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      >
        <div className="bg-primary/20 absolute -top-24 -left-24 size-72 rounded-full blur-3xl" />
        <div className="bg-chart-1/30 absolute right-0 -bottom-32 size-96 rounded-full blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo showText={false} className="scale-125" />
          </div>
          <div className="space-y-1">
            <CardTitle className="font-heading text-2xl">
              Semillitas del Oriente
            </CardTitle>
            <CardDescription>Agenda Digital</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rol">Perfil de acceso</Label>
              <Select defaultValue="directora">
                <SelectTrigger id="rol" className="w-full">
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="directora">
                    Directora / Jefatura
                  </SelectItem>
                  <SelectItem value="docente" disabled>
                    Docente / Educadora (próximamente)
                  </SelectItem>
                  <SelectItem value="apoderado" disabled>
                    Apoderado (próximamente)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu.correo@ssmoriente.cl"
                defaultValue="afica@ssmoriente.cl"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary text-xs"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                defaultValue="demo1234"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <RiLoader4Line className="size-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-xs">
            Servicio de Salud Metropolitano Oriente · Demo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
