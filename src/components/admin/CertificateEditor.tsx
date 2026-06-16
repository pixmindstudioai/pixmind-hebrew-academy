import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  CertificateConfig,
  CertTextField,
  CertSignature,
  CERT_FONTS,
  CERT_SAMPLE_NAMES,
  defaultField,
  fieldText,
} from '@/lib/certificate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export interface CertificateEditorProps {
  templateImageUrl: string;
  config: CertificateConfig;
  onChange: (c: CertificateConfig) => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Draggable field chip ─────────────────────────────────────────────────────

interface FieldChipProps {
  field: CertTextField;
  containerH: number;
  isSelected: boolean;
  onClick: () => void;
  onMove: (x: number, y: number) => void;
}

const FieldChip = ({ field, containerH, isSelected, onClick, onMove }: FieldChipProps) => {
  const dragging = useRef(false);
  const origin = useRef({ px: 0, py: 0, fx: 0, fy: 0 });
  const chipRef = useRef<HTMLDivElement>(null);

  const fontSizePx = field.fontSize * containerH;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    origin.current = { px: e.clientX, py: e.clientY, fx: field.x, fy: field.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !chipRef.current) return;
    const container = chipRef.current.closest('.cert-canvas') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = (e.clientX - origin.current.px) / rect.width;
    const dy = (e.clientY - origin.current.py) / rect.height;
    onMove(clamp(origin.current.fx + dx), clamp(origin.current.fy + dy));
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={chipRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        'absolute cursor-grab active:cursor-grabbing select-none whitespace-nowrap rounded px-1',
        isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : 'ring-1 ring-white/60'
      )}
      style={{
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        fontFamily: field.fontFamily,
        fontSize: fontSizePx > 0 ? `${fontSizePx}px` : '14px',
        color: field.color,
        fontWeight: field.weight ?? 700,
        direction: field.lang === 'en' ? 'ltr' : 'rtl',
        textAlign: field.align,
        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
      }}
    >
      {fieldText(field, CERT_SAMPLE_NAMES) || field.label || field.key}
    </div>
  );
};

// ─── Draggable signature anchor ───────────────────────────────────────────────

interface SignatureAnchorProps {
  sig: CertSignature;
  index: number;
  containerW: number;
  isSelected: boolean;
  onClick: () => void;
  onMove: (x: number, y: number) => void;
}

const SignatureAnchor = ({
  sig,
  index,
  containerW,
  isSelected,
  onClick,
  onMove,
}: SignatureAnchorProps) => {
  const dragging = useRef(false);
  const origin = useRef({ px: 0, py: 0, sx: 0, sy: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);

  const widthPx = sig.width * containerW;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    origin.current = { px: e.clientX, py: e.clientY, sx: sig.x, sy: sig.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !anchorRef.current) return;
    const container = anchorRef.current.closest('.cert-canvas') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = (e.clientX - origin.current.px) / rect.width;
    const dy = (e.clientY - origin.current.py) / rect.height;
    onMove(clamp(origin.current.sx + dx), clamp(origin.current.sy + dy));
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={anchorRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        'absolute cursor-grab active:cursor-grabbing select-none border-2 border-dashed flex items-center justify-center text-xs rounded',
        isSelected ? 'border-blue-400 bg-blue-400/10' : 'border-white/70 bg-white/5'
      )}
      style={{
        left: `${sig.x * 100}%`,
        top: `${sig.y * 100}%`,
        width: widthPx,
        height: widthPx * 0.35,
        transform: 'translate(-50%, -50%)',
        color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.7)',
        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
      }}
    >
      {sig.label ?? `חתימה ${index + 1}`}
    </div>
  );
};

// ─── Main Editor ──────────────────────────────────────────────────────────────

type Selection =
  | { kind: 'field'; index: number }
  | { kind: 'sig'; index: number }
  | null;

const CertificateEditor = ({ templateImageUrl, config, onChange }: CertificateEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<Selection>(null);
  const [customFieldKey, setCustomFieldKey] = useState('');

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── field helpers ──────────────────────────────────────────────────────────

  const updateField = useCallback(
    (index: number, patch: Partial<CertTextField>) => {
      const fields = config.fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
      onChange({ ...config, fields });
    },
    [config, onChange]
  );

  const addField = (key: string) => {
    const fields = [...config.fields, defaultField(key)];
    onChange({ ...config, fields });
    setSelected({ kind: 'field', index: fields.length - 1 });
  };

  const removeField = (index: number) => {
    const fields = config.fields.filter((_, i) => i !== index);
    onChange({ ...config, fields });
    setSelected(null);
  };

  // ── signature helpers ──────────────────────────────────────────────────────

  const updateSig = useCallback(
    (index: number, patch: Partial<CertSignature>) => {
      const signatures = config.signatures.map((s, i) =>
        i === index ? { ...s, ...patch } : s
      );
      onChange({ ...config, signatures });
    },
    [config, onChange]
  );

  const addSig = () => {
    const signatures = [
      ...config.signatures,
      { x: 0.5, y: 0.8, width: 0.18, label: `חתימה ${config.signatures.length + 1}` },
    ];
    onChange({ ...config, signatures });
    setSelected({ kind: 'sig', index: signatures.length - 1 });
  };

  const removeSig = (index: number) => {
    const signatures = config.signatures.filter((_, i) => i !== index);
    onChange({ ...config, signatures });
    setSelected(null);
  };

  // ── selected field / sig accessors ────────────────────────────────────────

  const selField =
    selected?.kind === 'field' ? config.fields[selected.index] : null;
  const selSig =
    selected?.kind === 'sig' ? config.signatures[selected.index] : null;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="cert-canvas relative w-full overflow-hidden rounded-lg border border-border select-none"
        style={{ touchAction: 'none' }}
      >
        <img
          src={templateImageUrl}
          alt="תבנית תעודה"
          className="w-full h-auto block pointer-events-none"
          style={{ objectFit: 'contain' }}
          onLoad={() => {
            if (containerRef.current) {
              const { width, height } = containerRef.current.getBoundingClientRect();
              setContainerSize({ w: width, h: height });
            }
          }}
          draggable={false}
        />
        {containerSize.h > 0 &&
          config.fields.map((field, i) => (
            <FieldChip
              key={`field-${i}`}
              field={field}
              containerH={containerSize.h}
              isSelected={selected?.kind === 'field' && selected.index === i}
              onClick={() => setSelected({ kind: 'field', index: i })}
              onMove={(x, y) => updateField(i, { x, y })}
            />
          ))}
        {containerSize.w > 0 &&
          config.signatures.map((sig, i) => (
            <SignatureAnchor
              key={`sig-${i}`}
              sig={sig}
              index={i}
              containerW={containerSize.w}
              isSelected={selected?.kind === 'sig' && selected.index === i}
              onClick={() => setSelected({ kind: 'sig', index: i })}
              onMove={(x, y) => updateSig(i, { x, y })}
            />
          ))}
        {config.fields.length === 0 && config.signatures.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="bg-black/50 text-white text-sm px-4 py-2 rounded-lg">
              הוסף שדה מהחלונית למטה כדי להתחיל
            </p>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: field list + add */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">שדות טקסט</Label>
          </div>

          {/* Existing fields */}
          {config.fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">אין שדות. הוסף שדה להלן.</p>
          ) : (
            <div className="space-y-1">
              {config.fields.map((f, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg cursor-pointer border',
                    selected?.kind === 'field' && selected.index === i
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  )}
                  onClick={() => setSelected({ kind: 'field', index: i })}
                >
                  <span className="text-sm truncate">{f.label ?? f.key}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(i);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add field buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={() => addField('name_he')}
            >
              <Plus className="w-3 h-3" />
              שם בעברית
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={() => addField('name_en')}
            >
              <Plus className="w-3 h-3" />
              שם באנגלית
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="שם שדה חופשי"
              value={customFieldKey}
              onChange={(e) => setCustomFieldKey(e.target.value)}
              className="flex-1 text-sm h-8"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!customFieldKey.trim()}
              onClick={() => {
                if (customFieldKey.trim()) {
                  addField(customFieldKey.trim());
                  setCustomFieldKey('');
                }
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Signature section */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">עוגני חתימות</Label>
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={addSig}>
                <Plus className="w-3 h-3" />
                הוסף חתימה
              </Button>
            </div>
            {config.signatures.map((s, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg cursor-pointer border',
                  selected?.kind === 'sig' && selected.index === i
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                )}
                onClick={() => setSelected({ kind: 'sig', index: i })}
              >
                <span className="text-sm truncate">{s.label ?? `חתימה ${i + 1}`}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSig(i);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: selected field / sig properties */}
        <div className="space-y-3">
          {selField && selected?.kind === 'field' && (
            <>
              <p className="text-sm font-semibold text-muted-foreground">
                עריכת שדה: {selField.label ?? selField.key}
              </p>

              {/* Font family */}
              <div className="space-y-1">
                <Label className="text-xs">גופן</Label>
                <Select
                  value={selField.fontFamily}
                  onValueChange={(v) => updateField(selected.index, { fontFamily: v })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_FONTS.map((f) => (
                      <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font size */}
              <div className="space-y-1">
                <Label className="text-xs">
                  גודל גופן ({Math.round(selField.fontSize * 1000) / 10}% מגובה התבנית)
                </Label>
                <Slider
                  min={0.02}
                  max={0.12}
                  step={0.002}
                  value={[selField.fontSize]}
                  onValueChange={([v]) => updateField(selected.index, { fontSize: v })}
                />
              </div>

              {/* Color */}
              <div className="space-y-1">
                <Label className="text-xs">צבע טקסט</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selField.color}
                    onChange={(e) => updateField(selected.index, { color: e.target.value })}
                    className="h-8 w-16 rounded border border-border cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground font-mono">{selField.color}</span>
                </div>
              </div>

              {/* Alignment */}
              <div className="space-y-1">
                <Label className="text-xs">יישור</Label>
                <div className="flex gap-1">
                  {(['right', 'center', 'left'] as const).map((a) => (
                    <Button
                      key={a}
                      size="sm"
                      variant={selField.align === a ? 'default' : 'outline'}
                      className="flex-1 h-8"
                      onClick={() => updateField(selected.index, { align: a })}
                    >
                      {a === 'right' ? (
                        <AlignRight className="w-3 h-3" />
                      ) : a === 'center' ? (
                        <AlignCenter className="w-3 h-3" />
                      ) : (
                        <AlignLeft className="w-3 h-3" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <Label className="text-xs">עובי גופן</Label>
                <Select
                  value={String(selField.weight ?? 700)}
                  onValueChange={(v) => updateField(selected.index, { weight: Number(v) })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">רגיל (400)</SelectItem>
                    <SelectItem value="600">בינוני (600)</SelectItem>
                    <SelectItem value="700">מודגש (700)</SelectItem>
                    <SelectItem value="800">כבד (800)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lang */}
              <div className="space-y-1">
                <Label className="text-xs">כיוון שפה</Label>
                <div className="flex gap-1">
                  {(['he', 'en'] as const).map((l) => (
                    <Button
                      key={l}
                      size="sm"
                      variant={selField.lang === l ? 'default' : 'outline'}
                      className="flex-1 h-8 text-xs"
                      onClick={() => updateField(selected.index, { lang: l })}
                    >
                      {l === 'he' ? 'עברית' : 'English'}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {selSig && selected?.kind === 'sig' && (
            <>
              <p className="text-sm font-semibold text-muted-foreground">
                עוגן חתימה: {selSig.label ?? `חתימה ${selected.index + 1}`}
              </p>

              {/* Label */}
              <div className="space-y-1">
                <Label className="text-xs">תווית</Label>
                <Input
                  value={selSig.label ?? ''}
                  onChange={(e) => updateSig(selected.index, { label: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="שם החותם"
                />
              </div>

              {/* Width */}
              <div className="space-y-1">
                <Label className="text-xs">
                  רוחב ({Math.round(selSig.width * 100)}% מרוחב התבנית)
                </Label>
                <Slider
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={[selSig.width]}
                  onValueChange={([v]) => updateSig(selected.index, { width: v })}
                />
              </div>
            </>
          )}

          {!selField && !selSig && (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              <Type className="w-6 h-6 mb-2" />
              לחץ על שדה בתבנית או ברשימה כדי לערוך
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateEditor;
