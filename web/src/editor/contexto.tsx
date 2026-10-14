import { createContext, useContext } from 'react';
import { useAlmacen, type Almacen } from '../mundo/almacen';
import type { Arte } from '../mundo/arte';
import type { EstadoMundo } from '../mundo/tipos';
import type { ControladorEditor } from './controlador';

export interface ContextoEditor {
  ctl: ControladorEditor;
  almacen: Almacen<EstadoMundo>;
  arte: Arte;
  /** Sale de construir (guarda el borrador antes). */
  salir(): void;
  /** Abre la ventana para publicar. */
  publicar(): void;
  /** Vuelve a pedir lo último que hay en el servidor cuando alguien más guardó. */
  recargarDelServidor(): void;
  /** Quién guardó el borrador por última vez (para el aviso de conflicto). */
  autorBorrador: string;
  /** Si la persona edita solo su área: el editor se reduce a poner y quitar objetos, y «Publicar» pasa a «Guardar mi área». */
  areaPropia: { nombre: string } | null;
  /** Paquetes del catálogo de esta persona (solo cuando edita su área). `null` es sin restricción, como quien construye. */
  paquetes: string[] | null;
  /** Guarda el área y sale (solo cuando `areaPropia` existe). */
  guardarArea(): void;
}

const Ctx = createContext<ContextoEditor | null>(null);

export const ProveedorEditor = Ctx.Provider;

export function useEditor(): ContextoEditor {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEditor debe usarse dentro de ProveedorEditor');
  return c;
}

/** Lee una parte del estado del mundo. El selector debe devolver valores simples o referencias estables. */
export function useEstado<R>(selector: (e: EstadoMundo) => R): R {
  const { almacen } = useEditor();
  return useAlmacen(almacen, selector);
}
