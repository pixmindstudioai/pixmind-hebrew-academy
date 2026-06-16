// Shared contract for the certificate feature — used by the admin editor,
// the client-side renderer, and the data hooks so they stay in sync.

/** Curated fonts (Hebrew-capable first) selectable per text field. */
export const CERT_FONTS = [
  'Heebo',
  'Rubik',
  'Assistant',
  'Frank Ruhl Libre',
  'Secular One',
  'Arial',
  'Georgia',
  'Times New Roman',
] as const;
export type CertFont = (typeof CERT_FONTS)[number];

/**
 * A text field placed on the template. All geometry is normalized 0..1 over
 * the template image's natural size so it renders identically at any scale.
 * `fontSize` is a fraction of the template's natural HEIGHT.
 * `x` is the anchor whose meaning depends on `align` (center/right/left).
 */
export interface CertTextField {
  key: 'name_he' | 'name_en' | string;
  label?: string;
  x: number;
  y: number;
  width?: number;
  fontFamily: CertFont | string;
  fontSize: number;
  color: string;
  align: 'center' | 'right' | 'left';
  weight?: number;
  lang?: 'he' | 'en';
}

/** A signature image / anchor placed on the template (normalized coords). */
export interface CertSignature {
  x: number;
  y: number;
  width: number;
  imageUrl?: string | null;
  label?: string;
}

export interface CertificateConfig {
  fields: CertTextField[];
  signatures: CertSignature[];
}

export const EMPTY_CERT_CONFIG: CertificateConfig = { fields: [], signatures: [] };

/** Sample names used for the admin live-preview. */
export const CERT_SAMPLE_NAMES = { full_name: 'אריאל איזנשטט', full_name_en: 'Ariel Aizenshtat' };

/** Sensible default for a freshly-added field of a given key. */
export function defaultField(key: string): CertTextField {
  const isEn = key === 'name_en';
  return {
    key,
    label: key === 'name_he' ? 'שם (עברית)' : key === 'name_en' ? 'Name (English)' : key,
    x: 0.5,
    y: isEn ? 0.55 : 0.47,
    width: 0.7,
    fontFamily: isEn ? 'Georgia' : 'Heebo',
    fontSize: 0.05,
    color: '#ffffff',
    align: 'center',
    weight: 700,
    lang: isEn ? 'en' : 'he',
  };
}

/** Resolve the text to draw for a field from a student's stored names. */
export function fieldText(
  field: CertTextField,
  names: { full_name?: string | null; full_name_en?: string | null }
): string {
  if (field.key === 'name_he') return names.full_name ?? '';
  if (field.key === 'name_en') return names.full_name_en ?? names.full_name ?? '';
  return field.label ?? '';
}
