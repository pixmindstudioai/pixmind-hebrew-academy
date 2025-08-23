import React, { useState } from 'react';
import { Search, UserPlus, Mail, Calendar, FileText, Trash2, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserAccessByEmail, useCreateUserAccess, useDeleteUserAccess, useBulkGrantAccess } from '@/hooks/useUserAccess';
import { useModules } from '@/hooks/useContentData';
import { useAdminRole } from '@/hooks/useAdminRole';
import { format } from 'date-fns';

const UserManagementPage = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [showBulkGrant, setShowBulkGrant] = useState(false);

  const { data: adminCheck, isLoading: isLoadingAdmin } = useAdminRole();
  const { data: userAccess = [], isLoading: isLoadingAccess } = useUserAccessByEmail(selectedEmail);
  const { data: modules = [], isLoading: isLoadingModules } = useModules('all');
  
  const createAccess = useCreateUserAccess();
  const deleteAccess = useDeleteUserAccess();
  const bulkGrant = useBulkGrantAccess();

  // Show loading while checking admin status
  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  // Block access for non-admins
  if (!adminCheck?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>גישה מוגבלת</CardTitle>
            <CardDescription>
              אין לך הרשאה לצפות בעמוד זה
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                עמוד זה זמין רק למנהלי מערכת
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSearch = () => {
    if (searchEmail.trim()) {
      setSelectedEmail(searchEmail.trim().toLowerCase());
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedEmail || selectedModules.length === 0) return;

    for (const moduleId of selectedModules) {
      await createAccess.mutateAsync({
        user_email: selectedEmail,
        module_id: moduleId,
        expires_at: expiryDate || undefined,
        notes: notes || undefined,
      });
    }

    // Reset form
    setSelectedModules([]);
    setExpiryDate('');
    setNotes('');
  };

  const handleBulkGrant = async () => {
    const emails = bulkEmails
      .split(/[,\n]/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0 || selectedModules.length === 0) return;

    await bulkGrant.mutateAsync({
      emails,
      moduleIds: selectedModules,
      expiresAt: expiryDate || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setBulkEmails('');
    setSelectedModules([]);
    setExpiryDate('');
    setNotes('');
    setShowBulkGrant(false);
  };

  const handleDeleteAccess = (accessId: string) => {
    deleteAccess.mutate(accessId);
  };

  const isEmailValid = (email: string) => {
    return email.includes('@') && email.includes('.');
  };

  const userAccessByModule = userAccess.reduce((acc, access) => {
    acc[access.module_id] = access;
    return acc;
  }, {} as Record<string, typeof userAccess[0]>);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ניהול משתמשים</h1>
        <p className="text-muted-foreground">
          מנהל הרשאות גישה למודולים עבור משתמשים לפי כתובת אימייל
        </p>
        
        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            ברוך הבא, {adminCheck.profile?.full_name || adminCheck.profile?.email}! 
            יש לך הרשאות מנהל מערכת.
          </AlertDescription>
        </Alert>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            חיפוש משתמש
          </CardTitle>
          <CardDescription>
            הזן כתובת אימייל לחיפוש או יצירת הרשאות חדשות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="example@email.com"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={!isEmailValid(searchEmail)}
            >
              חיפוש
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowBulkGrant(!showBulkGrant)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              מתן הרשאות מרובות
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Grant Section */}
      {showBulkGrant && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>מתן הרשאות מרובות</CardTitle>
            <CardDescription>
              הזן מספר כתובות אימייל (מופרדות בפסיק או בשורות חדשות) ובחר מודולים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bulk-emails">כתובות אימייל</Label>
              <Textarea
                id="bulk-emails"
                placeholder="email1@example.com, email2@example.com..."
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>מודולים</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {modules.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`bulk-module-${module.id}`}
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedModules([...selectedModules, module.id]);
                        } else {
                          setSelectedModules(selectedModules.filter(id => id !== module.id));
                        }
                      }}
                    />
                    <Label htmlFor={`bulk-module-${module.id}`} className="text-sm">
                      {module.title}
                      {module.is_paid && <Badge variant="secondary" className="mr-2">בתשלום</Badge>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-expiry">תאריך תפוגה (אופציונלי)</Label>
                <Input
                  id="bulk-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bulk-notes">הערות</Label>
                <Input
                  id="bulk-notes"
                  placeholder="הערות אופציונליות..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkGrant(false)}>
                ביטול
              </Button>
              <Button 
                onClick={handleBulkGrant}
                disabled={!bulkEmails.trim() || selectedModules.length === 0 || bulkGrant.isPending}
              >
                {bulkGrant.isPending ? 'מעניק הרשאות...' : 'מתן הרשאות'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Details Section */}
      {selectedEmail && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                הרשאות עבור: {selectedEmail}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAccess ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">טוען...</p>
                </div>
              ) : userAccess.length === 0 ? (
                <p className="text-muted-foreground">לא נמצאו הרשאות למשתמש זה</p>
              ) : (
                <div className="space-y-3">
                  {userAccess.map((access) => (
                    <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{access.module?.title}</h4>
                        {access.module?.is_paid && (
                          <Badge variant="secondary" className="mt-1">בתשלום</Badge>
                        )}
                        {access.expires_at && (
                          <p className="text-sm text-muted-foreground mt-1">
                            תפוגה: {format(new Date(access.expires_at), 'dd/MM/yyyy')}
                          </p>
                        )}
                        {access.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            הערות: {access.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccess(access.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={deleteAccess.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grant New Access */}
          <Card>
            <CardHeader>
              <CardTitle>מתן הרשאות חדשות</CardTitle>
              <CardDescription>
                בחר מודולים להענקת גישה למשתמש זה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>מודולים זמינים</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {modules.map((module) => {
                    const hasAccess = userAccessByModule[module.id];
                    return (
                      <div key={module.id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`module-${module.id}`}
                          checked={selectedModules.includes(module.id)}
                          disabled={!!hasAccess}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedModules([...selectedModules, module.id]);
                            } else {
                              setSelectedModules(selectedModules.filter(id => id !== module.id));
                            }
                          }}
                        />
                        <Label htmlFor={`module-${module.id}`} className="flex-1">
                          <span className={hasAccess ? 'text-muted-foreground' : ''}>
                            {module.title}
                          </span>
                          {module.is_paid && (
                            <Badge variant="secondary" className="mr-2">בתשלום</Badge>
                          )}
                          {hasAccess && (
                            <Badge variant="outline" className="mr-2">קיימת גישה</Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="expiry-date">תאריך תפוגה (אופציונלי)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="access-notes">הערות</Label>
                  <Textarea
                    id="access-notes"
                    placeholder="הערות אופציונליות על ההרשאה..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Button
                onClick={handleGrantAccess}
                disabled={selectedModules.length === 0 || createAccess.isPending}
                className="w-full"
              >
                {createAccess.isPending ? 'מעניק הרשאות...' : 'מתן הרשאות'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;