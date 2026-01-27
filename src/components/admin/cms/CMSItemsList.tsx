import { useState, useMemo, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';

interface CMSItemsListProps<T> {
  items: T[];
  isLoading: boolean;
  title: string;
  description: string;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  createButtonText: string;
  onCreateClick: () => void;
  searchPlaceholder?: string;
  getSearchableText: (item: T) => string;
  getItemStatus: (item: T) => boolean;
  renderItem: (item: T) => ReactNode;
  statusFilterOptions?: { value: string; label: string }[];
}

export function CMSItemsList<T extends { id: string }>({
  items,
  isLoading,
  title,
  description,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  createButtonText,
  onCreateClick,
  searchPlaceholder = 'חיפוש...',
  getSearchableText,
  getItemStatus,
  renderItem,
  statusFilterOptions = [
    { value: 'all', label: 'הכל' },
    { value: 'active', label: 'פעילים' },
    { value: 'inactive', label: 'לא פעילים' }
  ]
}: CMSItemsListProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      const searchText = getSearchableText(item).toLowerCase();
      const matchesSearch = searchQuery === '' || searchText.includes(searchQuery.toLowerCase());

      // Status filter
      const isActive = getItemStatus(item);
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter, getSearchableText, getItemStatus]);

  if (isLoading) {
    return (
      <div className="space-y-4" dir="rtl">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onCreateClick} className="gap-2">
          <Plus className="w-4 h-4" />
          {createButtonText}
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pr-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {emptyIcon}
            <h3 className="text-lg font-medium mb-2">{emptyTitle}</h3>
            <p className="text-muted-foreground mb-4">{emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div key={item.id}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
