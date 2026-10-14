import { useMemo } from 'react';
import type { ObjetoCatalogo, Orientacion } from '@ol/shared';
import { useEditor } from './contexto';

/** Dibujo pequeño de un objeto del inventario, con los píxeles sin suavizar. */
export function MiniaturaObjeto({ objeto, variante = 'base', orientacion, lado = 48 }: { objeto: ObjetoCatalogo; variante?: string; orientacion?: Orientacion; lado?: number }) {
  const { arte } = useEditor();
  const url = useMemo(() => arte.miniatura(objeto, variante, orientacion, lado), [arte, objeto, variante, orientacion, lado]);
  return <img className="ed-mini" src={url} width={lado} height={lado} alt="" draggable={false} />;
}
