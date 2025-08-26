import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Clock, User, Mail, BookOpen, Calendar, CreditCard, Hash } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ExtendAccessModal } from './ExtendAccessModal';

interface Enrollment {
  id: string;
  user_email: string;
  user_name?: string;
  module_title: string;
  module_id: string;
  granted_at: string;
  expires_at?: string;
  provider?: string;
  transaction_id?: string;
  notes?: string;
  is_active: boolean;
}

interface EnrollmentsTableProps {
  enrollments: Enrollment[];
  isLoading: boolean;
  onRevokeAccess: (enrollmentId: string) => void;
  onRefresh: () => void;
}

export function EnrollmentsTable({ 
  enrollments, 
  isLoading, 
  onRevokeAccess,
  onRefresh 
}: EnrollmentsTableProps) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!enrollments.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">אין הרשמות להצגה</p>
            <p className="text-sm mt-2">נסה לשנות את הפילטרים או להוסיף הרשמות חדשות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExtendAccess = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowExtendModal(true);
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">משתמש</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">קורס</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">תאריך מתן גישה</TableHead>
                  <TableHead className="text-right">ספק</TableHead>
                  <TableHead className="text-right">מזהה עסקה</TableHead>
                  <TableHead className="text-right">תפוגה</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {enrollment.user_name || enrollment.user_email}
                      </div>
                    </TableCell>
                    <TableCell>{enrollment.user_email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {enrollment.module_title}
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        isActive={enrollment.is_active}
                        expiresAt={enrollment.expires_at}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(enrollment.granted_at).toLocaleDateString('he-IL')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {enrollment.provider || 'ידני'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enrollment.transaction_id ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {enrollment.transaction_id}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {enrollment.expires_at ? 
                        new Date(enrollment.expires_at).toLocaleDateString('he-IL') : 
                        <span className="text-muted-foreground">ללא הגבלה</span>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtendAccess(enrollment)}
                          className="h-8 px-2"
                        >
                          <Clock className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRevokeAccess(enrollment.id)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {enrollment.user_name || enrollment.user_email}
                      </span>
                    </div>
                    <StatusBadge 
                      isActive={enrollment.is_active}
                      expiresAt={enrollment.expires_at}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {enrollment.user_email}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{enrollment.module_title}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(enrollment.granted_at).toLocaleDateString('he-IL')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {enrollment.provider || 'ידני'}
                      </Badge>
                    </div>
                  </div>
                  
                  {enrollment.transaction_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {enrollment.transaction_id}
                      </code>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      תפוגה: {enrollment.expires_at ? 
                        new Date(enrollment.expires_at).toLocaleDateString('he-IL') : 
                        'ללא הגבלה'
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExtendAccess(enrollment)}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevokeAccess(enrollment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extend Access Modal */}
      <ExtendAccessModal
        open={showExtendModal}
        onOpenChange={setShowExtendModal}
        enrollment={selectedEnrollment}
        onSuccess={() => {
          onRefresh();
          setShowExtendModal(false);
          setSelectedEnrollment(null);
        }}
      />
    </>
  );
}