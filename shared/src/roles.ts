/** Roles y permisos. Es la única fuente: el servidor decide con esto y la interfaz solo lo refleja. */

export const ROLES = ['admin', 'constructor', 'usuario'] as const;
export type Rol = (typeof ROLES)[number];

export const ETIQUETA_ROL: Record<Rol, string> = {
  admin: 'Administración',
  constructor: 'Constructor',
  usuario: 'Persona',
};

export const DESCRIPCION_ROL: Record<Rol, string> = {
  admin: 'Arma la oficina y administra cuentas, solicitudes, actividad y configuración.',
  constructor: 'Arma y publica la oficina. No administra cuentas ni configuración.',
  usuario: 'Camina por la oficina, marca su estado y habla con otras personas.',
};

export const PERMISOS = ['administrar', 'construir', 'caminar'] as const;
export type Permiso = (typeof PERMISOS)[number];

export const PERMISOS_POR_ROL: Record<Rol, readonly Permiso[]> = {
  admin: ['administrar', 'construir', 'caminar'],
  constructor: ['construir', 'caminar'],
  usuario: ['caminar'],
};

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && (ROLES as readonly string[]).includes(valor);
}

export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return PERMISOS_POR_ROL[rol].includes(permiso);
}
