import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CMSTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'url' | 'datetime-local' | 'date';
}

export const CMSTextField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text'
}: CMSTextFieldProps) => {
  return (
    <div>
      <Label htmlFor={id}>{label}{required && ' *'}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

interface CMSTextareaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const CMSTextareaField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4
}: CMSTextareaFieldProps) => {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
};

interface CMSSwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const CMSSwitchField = ({
  id,
  label,
  checked,
  onCheckedChange
}: CMSSwitchFieldProps) => {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};

interface CMSDateRangeFieldsProps {
  startLabel: string;
  startValue: string;
  onStartChange: (value: string) => void;
  endLabel: string;
  endValue: string;
  onEndChange: (value: string) => void;
  type?: 'datetime-local' | 'date';
}

export const CMSDateRangeFields = ({
  startLabel,
  startValue,
  onStartChange,
  endLabel,
  endValue,
  onEndChange,
  type = 'datetime-local'
}: CMSDateRangeFieldsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CMSTextField
        id="start_date"
        label={startLabel}
        value={startValue}
        onChange={onStartChange}
        type={type}
        required
      />
      <CMSTextField
        id="end_date"
        label={endLabel}
        value={endValue}
        onChange={onEndChange}
        type={type}
      />
    </div>
  );
};
