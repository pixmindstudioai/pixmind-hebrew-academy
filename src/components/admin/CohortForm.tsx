import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Cohort } from '@/hooks/useCohortsData';

interface CohortFormProps {
  cohort?: Cohort | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    start_date?: string | null;
    end_date?: string | null;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CohortForm = ({ cohort, onSubmit, onCancel, isLoading }: CohortFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (cohort) {
      setName(cohort.name);
      setDescription(cohort.description || '');
      setStartDate(cohort.start_date || '');
      setEndDate(cohort.end_date || '');
      setIsActive(cohort.is_active);
    } else {
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setIsActive(true);
    }
    setError('');
  }, [cohort]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('יש להזין שם למחזור');
      return;
    }
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: isActive,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">שם המחזור *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: מחזור אוקטובר 2025"
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="תיאור קצר של המחזור (אופציונלי)"
          rows={3}
          disabled={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">תאריך התחלה</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">תאריך סיום</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between py-2">
        <Label htmlFor="isActive" className="cursor-pointer">המחזור פעיל</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'שומר...' : 'שמור מחזור'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          ביטול
        </Button>
      </div>
    </form>
  );
};

export default CohortForm;
