import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useModuleAccess } from '@/hooks/useUserModuleAccess';

const UserAccessTest = () => {
  const { user } = useAuth();
  const { userAccess, isLoading } = useModuleAccess();
  const [testModuleId, setTestModuleId] = useState('');
  const [notification, setNotification] = useState('');

  // Simulate granting access to a module
  const grantAccess = async () => {
    if (!user?.email || !testModuleId) return;

    try {
      const { error } = await supabase
        .from('user_module_access')
        .insert([
          {
            user_email: user.email.toLowerCase(),
            module_id: testModuleId,
            granted_by: 'test-system',
            granted_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;
      
      setNotification('Access granted successfully!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error granting access:', error);
      setNotification('Error granting access');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Simulate revoking access to a module
  const revokeAccess = async () => {
    if (!user?.email || !testModuleId) return;

    try {
      const { error } = await supabase
        .from('user_module_access')
        .delete()
        .match({
          user_email: user.email.toLowerCase(),
          module_id: testModuleId
        });

      if (error) throw error;
      
      setNotification('Access revoked successfully!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error revoking access:', error);
      setNotification('Error revoking access');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>User Access Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p>Current User: {user?.email || 'Not logged in'}</p>
          <p>Access Count: {userAccess?.length || 0}</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        </div>
        
        {notification && (
          <div className="p-2 bg-green-100 text-green-800 rounded">
            {notification}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Module ID"
            value={testModuleId}
            onChange={(e) => setTestModuleId(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <Button onClick={grantAccess} disabled={!user?.email || !testModuleId}>
            Grant Access
          </Button>
          <Button onClick={revokeAccess} variant="destructive" disabled={!user?.email || !testModuleId}>
            Revoke Access
          </Button>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Current Access:</h3>
          <ul className="space-y-1">
            {userAccess?.map((access) => (
              <li key={access.id} className="text-sm p-2 bg-muted rounded">
                Module: {access.module_id} | Granted: {new Date(access.granted_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserAccessTest;