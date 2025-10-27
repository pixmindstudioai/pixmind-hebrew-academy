# Supabase Realtime User Access Implementation

This document explains how the real-time user access management system works in the PixMind Hebrew Academy platform.

## Overview

The implementation enables automatic, real-time updates to user access permissions without requiring page refreshes. When a user's access to a module is granted, revoked, or modified in the database, the UI immediately reflects these changes.

## Key Components

### 1. `useUserModuleAccess` Hook (Enhanced)

Location: `src/hooks/useUserModuleAccess.ts`

This hook has been enhanced with a real-time subscription to the `user_module_access` table:

```typescript
// Enable real-time subscription for user module access
useEffect(() => {
  if (!user?.email) return;
  
  const channel = supabase
    .channel(`user-access-${user.email}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_module_access',
        filter: `user_email=eq.${user.email.toLowerCase()}`
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['user-module-access', user.email] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.email, queryClient]);
```

**Behavior:**
- Listens for INSERT, UPDATE, and DELETE events on the `user_module_access` table
- Filters events to only those relevant to the current user
- Invalidates the React Query cache to trigger a fresh data fetch
- Automatically cleans up the subscription when the component unmounts

### 2. `useUserModuleAccessRealtime` Hook (New)

Location: `src/hooks/useUserModuleAccessRealtime.ts`

A dedicated hook for enabling real-time functionality that can be used in components:

```typescript
export const useUserModuleAccessRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel('user-module-access-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_module_access',
        },
        (payload) => {
          // Only process changes for the current user
          if (payload.new?.user_email?.toLowerCase() === user.email.toLowerCase() || 
              payload.old?.user_email?.toLowerCase() === user.email.toLowerCase()) {
            
            queryClient.invalidateQueries({ queryKey: ['user-module-access', user.email] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, queryClient]);

  return null;
};
```

### 3. Courses Page Integration

Location: `src/pages/Courses.tsx`

The Courses page now uses the real-time functionality:

```typescript
// Enable real-time updates for user module access
useUserModuleAccessRealtime();
```

This ensures that when a user's access permissions change, the course listings immediately update to show or hide paid content.

## How It Works

1. **User Authentication**: When a user logs in, their email is available through the `useAuth` hook.

2. **Real-time Subscription**: The `useUserModuleAccess` hook creates a Supabase Realtime channel that listens for changes to the `user_module_access` table, filtered by the user's email.

3. **Event Handling**: When any of the following events occur in the database:
   - **INSERT**: A new access record is created for the user
   - **UPDATE**: An existing access record is modified (e.g., expiration date changed)
   - **DELETE**: An access record is removed for the user

4. **UI Update**: The React Query cache is invalidated, which triggers a fresh fetch of the user's access permissions. Components using the `useModuleAccess` hook automatically re-render with the updated data.

## Database Requirements

### RLS Policies

The `user_module_access` table must have the appropriate Row Level Security policies:

```sql
-- Allow users to read their own access records
CREATE POLICY "Users can read own access by email"
ON public.user_module_access
FOR SELECT
TO authenticated
USING (lower(user_email) = lower((auth.jwt() -> 'email')::text));

-- Allow admins to manage all access records
CREATE POLICY "Admins can manage all access"
ON public.user_module_access
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'admin'::user_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'admin'::user_role
));
```

### Realtime Configuration

Ensure that Realtime is enabled for the `user_module_access` table in Supabase settings.

## Testing the Implementation

1. **Manual Testing**:
   - Log in as a user
   - Visit the Courses page
   - In Supabase dashboard, manually insert a record into `user_module_access` for that user
   - Observe that the UI updates immediately to show access to the new module

2. **Programmatic Testing**:
   - Use the provided `UserAccessTest` component to simulate granting/revoking access
   - Verify that UI elements update in real-time

## Benefits

1. **Immediate Feedback**: Users see access changes instantly without refreshing the page
2. **Improved UX**: No delay between admin actions and user experience
3. **Reduced Support Requests**: Users don't need to contact support for access issues
4. **Scalable**: Works for any number of concurrent users

## Security Considerations

1. **RLS Enforcement**: Database-level security ensures users can only see their own access records
2. **Authentication Required**: Only authenticated users can subscribe to real-time updates
3. **Email Matching**: Events are filtered to ensure users only receive updates about their own access

## Performance Considerations

1. **Efficient Filtering**: Database-level filtering reduces unnecessary network traffic
2. **Query Caching**: React Query optimizes data fetching and caching
3. **Subscription Cleanup**: Channels are properly cleaned up to prevent memory leaks