// src/services/sitioweb.service.ts
import api from './api';

export type TipoGaleria =
  | 'imagen' | 'video' | 'youtube' | 'shorts' | 'tiktok' | 'reel' | 'facebook' | 'instagram' | 'hero';

export interface GaleriaItem {
  id: number;
  tipo: TipoGaleria;
  archivo_url: string | null;
  enlace_url: string | null;
  titulo: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
}

// Base para armar la URL completa de un archivo subido (imagen/video).
// api.ts apunta a ".../api"; los archivos se sirven en la raíz del backend.
const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';
export const FILE_BASE_URL = API_BASE.replace(/\/api\/?$/, '');

export async function getGaleriaAdmin(): Promise<GaleriaItem[]> {
  const { data } = await api.get('/site-gallery');
  return data.items;
}

interface CrearItemPayload {
  tipo: TipoGaleria;
  titulo: string;
  descripcion?: string;
  enlace_url?: string;
  archivo?: File | null;
  orden?: number;
}

export async function crearItemGaleria(payload: CrearItemPayload): Promise<GaleriaItem> {
  const form = new FormData();
  form.append('tipo', payload.tipo);
  form.append('titulo', payload.titulo);
  if (payload.descripcion) form.append('descripcion', payload.descripcion);
  if (payload.enlace_url) form.append('enlace_url', payload.enlace_url);
  if (payload.orden !== undefined) form.append('orden', String(payload.orden));
  if (payload.archivo) form.append('archivo', payload.archivo);

  const { data } = await api.post('/site-gallery', form);
  return data.item;
}

interface ActualizarItemPayload {
  titulo?: string;
  descripcion?: string;
  enlace_url?: string;
  activo?: boolean;
  orden?: number;
  archivo?: File | null;
}

export async function actualizarItemGaleria(id: number, payload: ActualizarItemPayload): Promise<GaleriaItem> {
  const form = new FormData();
  if (payload.titulo !== undefined) form.append('titulo', payload.titulo);
  if (payload.descripcion !== undefined) form.append('descripcion', payload.descripcion);
  if (payload.enlace_url !== undefined) form.append('enlace_url', payload.enlace_url);
  if (payload.activo !== undefined) form.append('activo', String(payload.activo));
  if (payload.orden !== undefined) form.append('orden', String(payload.orden));
  if (payload.archivo) form.append('archivo', payload.archivo);

  const { data } = await api.put(`/site-gallery/${id}`, form);
  return data.item;
}

export async function eliminarItemGaleria(id: number): Promise<void> {
  await api.delete(`/site-gallery/${id}`);
}

// ============================================================
// Artículos de salud
// ============================================================
export type CategoriaArticulo = 'Fisioterapia' | 'Medicina' | 'Psicología';

export interface Articulo {
  id: number;
  titulo: string;
  descripcion: string;
  contenido: string;
  categoria: CategoriaArticulo;
  imagen_url: string | null;
  publicado_en: string; // 'YYYY-MM-DD'
  orden: number;
  activo: boolean;
}

export async function getArticulosAdmin(): Promise<Articulo[]> {
  const { data } = await api.get('/site-articles');
  return data.items;
}

interface CrearArticuloPayload {
  titulo: string;
  descripcion: string;
  contenido: string;
  categoria: CategoriaArticulo;
  publicado_en?: string;
  imagen?: File | null;
  orden?: number;
}

export async function crearArticulo(payload: CrearArticuloPayload): Promise<Articulo> {
  const form = new FormData();
  form.append('titulo', payload.titulo);
  form.append('descripcion', payload.descripcion);
  form.append('contenido', payload.contenido);
  form.append('categoria', payload.categoria);
  if (payload.publicado_en) form.append('publicado_en', payload.publicado_en);
  if (payload.orden !== undefined) form.append('orden', String(payload.orden));
  if (payload.imagen) form.append('imagen', payload.imagen);

  const { data } = await api.post('/site-articles', form);
  return data.item;
}

interface ActualizarArticuloPayload {
  titulo?: string;
  descripcion?: string;
  contenido?: string;
  categoria?: CategoriaArticulo;
  publicado_en?: string;
  activo?: boolean;
  orden?: number;
  imagen?: File | null;
}

export async function actualizarArticulo(id: number, payload: ActualizarArticuloPayload): Promise<Articulo> {
  const form = new FormData();
  if (payload.titulo !== undefined) form.append('titulo', payload.titulo);
  if (payload.descripcion !== undefined) form.append('descripcion', payload.descripcion);
  if (payload.contenido !== undefined) form.append('contenido', payload.contenido);
  if (payload.categoria !== undefined) form.append('categoria', payload.categoria);
  if (payload.publicado_en !== undefined) form.append('publicado_en', payload.publicado_en);
  if (payload.activo !== undefined) form.append('activo', String(payload.activo));
  if (payload.orden !== undefined) form.append('orden', String(payload.orden));
  if (payload.imagen) form.append('imagen', payload.imagen);

  const { data } = await api.put(`/site-articles/${id}`, form);
  return data.item;
}

export async function eliminarArticulo(id: number): Promise<void> {
  await api.delete(`/site-articles/${id}`);
}

// ============================================================
// Ubicación y contacto (configuración de una sola fila)
// ============================================================
export interface SiteSettings {
  id: number;
  ciudad_pais: string;
  sede_nombre: string;
  direccion_linea1: string;
  direccion_linea2: string;
  telefono_principal: string;
  telefono_secundario: string | null;
  whatsapp: string | null;
  whatsapp_grupo_url: string | null;
  email_contacto: string | null;
  horario_texto: string;
  mapa_embed_url: string;
  imagen_edificio_url: string | null;
  edificio_detalle: string;
  edificio_referencia: string;
}

export async function getSettings(): Promise<SiteSettings> {
  const { data } = await api.get('/site-settings');
  return data.settings;
}

export async function actualizarSettings(
  payload: Partial<Omit<SiteSettings, 'id' | 'imagen_edificio_url'>> & { imagen?: File | null }
): Promise<SiteSettings> {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'imagen') form.append('imagen', value as File);
    else form.append(key, String(value));
  });
  const { data } = await api.put('/site-settings', form);
  return data.settings;
}