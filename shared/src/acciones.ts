/** Etiquetas legibles de cada acción del registro de actividad. */
export const ETIQUETA_ACCION: Record<string, string> = {
  login: 'Inició sesión',
  login_fallido: 'Intento de ingreso fallido',
  bloqueo_cuenta: 'Cuenta bloqueada por intentos',
  logout: 'Cerró sesión',
  cambio_clave: 'Cambió su contraseña',
  crear_usuario: 'Creó una cuenta',
  activacion_fallida: 'Intento de activación fallido',
  crear_perfil: 'Creó un perfil pendiente de activación',
  generar_enlace: 'Generó un enlace de activación',
  activar_cuenta: 'Activó su cuenta con el enlace',
  editar_usuario: 'Editó una cuenta',
  eliminar_usuario: 'Eliminó una cuenta',
  restablecer_clave: 'Restableció una contraseña',
  solicitud_nueva: 'Solicitud de acceso recibida',
  solicitud_atendida: 'Atendió una solicitud',
  ajustes_guardados: 'Cambió la configuración',
  respaldo_manual: 'Hizo un respaldo',
  respaldo_auto: 'Respaldo automático',
  respaldo_descargado: 'Descargó un respaldo',
  actividad_exportada: 'Exportó la actividad',
  mapa_publicado: 'Publicó una versión de la oficina',
  mapa_restaurado: 'Restauró una versión de la oficina',
  mapa_borrador_descartado: 'Descartó el borrador de la oficina',
  mapa_area_editada: 'Editó su área de la oficina',
  planner_tarea_creada: 'Creó una tarea en el Planner',
  planner_tarea_borrada: 'Borró una tarea del Planner',
  planner_config: 'Cambió la configuración del Planner',
};

export function etiquetaAccion(accion: string): string {
  return ETIQUETA_ACCION[accion] ?? accion;
}
