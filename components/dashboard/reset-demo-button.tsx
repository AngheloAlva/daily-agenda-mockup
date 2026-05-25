"use client";

import { useState } from "react";
import { RiRefreshLine } from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDbContext } from "@/lib/db/provider";

export function ResetDemoButton() {
  const ctx = useDbContext();
  const [reseteando, setReseteando] = useState(false);
  const [open, setOpen] = useState(false);

  const handleReset = async () => {
    setReseteando(true);
    try {
      await ctx.reset();
      toast.success("Demo reiniciado", {
        description: "Los datos volvieron al estado inicial.",
      });
    } catch (error) {
      toast.error("Error al reiniciar", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      });
    } finally {
      setReseteando(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reiniciar demo"
              disabled={reseteando}
            >
              <RiRefreshLine className="size-5" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Reiniciar demo</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar el demo?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borrarán los cambios que hayas hecho en este navegador y los datos
            volverán al estado inicial. Esta acción no afecta a otros visitantes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={reseteando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleReset();
            }}
            disabled={reseteando}
          >
            {reseteando ? "Reiniciando…" : "Sí, reiniciar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
