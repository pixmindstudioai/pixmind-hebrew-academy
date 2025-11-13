import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive table wrapper that handles mobile overflow
 * On mobile: Adds horizontal scroll
 * On desktop: Normal table display
 */
export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ children, className }) => {
  return (
    <div className="w-full overflow-x-auto -mx-3 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-border rounded-lg">
          <Table className={cn("min-w-[640px]", className)}>
            {children}
          </Table>
        </div>
      </div>
    </div>
  );
};

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
