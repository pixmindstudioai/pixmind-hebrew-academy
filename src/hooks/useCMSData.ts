import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Generic CMS configuration interface
interface CMSConfig<TItem, TFormData> {
  tableName: string;
  visibilityTableName?: string;
  visibilityForeignKey?: string;
  queryKey: string;
  userQueryKey?: string;
  orderBy?: { column: string; ascending: boolean };
  transformToInsert?: (formData: TFormData) => Record<string, unknown>;
  transformToUpdate?: (formData: TFormData) => Record<string, unknown>;
  messages: {
    createSuccess: string;
    createError: string;
    updateSuccess: string;
    updateError: string;
    deleteSuccess: string;
    deleteError: string;
    toggleError: string;
  };
}

// Generic visibility record
interface VisibilityRecord {
  id?: string;
  module_id: string | null;
  bundle_id: string | null;
}

// Helper to create type-safe supabase queries
async function fetchFromTable<T>(
  tableName: string,
  options?: {
    filter?: { column: string; value: unknown };
    orderBy?: { column: string; ascending: boolean };
  }
): Promise<T[]> {
  // Use type assertion to bypass strict typing for dynamic table names
  let query = (supabase as any).from(tableName).select('*');
  
  if (options?.filter) {
    query = query.eq(options.filter.column, options.filter.value);
  }
  
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as T[];
}

async function insertIntoTable<T>(
  tableName: string,
  data: Record<string, unknown>
): Promise<T> {
  const { data: result, error } = await (supabase as any)
    .from(tableName)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result as T;
}

async function updateInTable<T>(
  tableName: string,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  const { data: result, error } = await (supabase as any)
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result as T;
}

async function deleteFromTable(tableName: string, id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function deleteFromTableWhere(
  tableName: string,
  column: string,
  value: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from(tableName)
    .delete()
    .eq(column, value);

  if (error) throw error;
}

async function insertManyIntoTable(
  tableName: string,
  records: Record<string, unknown>[]
): Promise<void> {
  const { error } = await (supabase as any)
    .from(tableName)
    .insert(records);

  if (error) throw error;
}

// Factory function to create CMS hooks for different content types
export function createCMSHook<TItem extends { id: string; is_active: boolean }, TFormData>(
  config: CMSConfig<TItem, TFormData>
) {
  return function useCMSData() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch all items (admin view)
    const { data: allItems = [], isLoading: itemsLoading } = useQuery({
      queryKey: [config.queryKey],
      queryFn: () => fetchFromTable<TItem>(config.tableName, {
        orderBy: config.orderBy
      })
    });

    // Fetch user-visible items
    const { data: userItems = [], isLoading: userItemsLoading } = useQuery({
      queryKey: [config.userQueryKey || `user-${config.queryKey}`],
      queryFn: () => fetchFromTable<TItem>(config.tableName, {
        filter: { column: 'is_active', value: true },
        orderBy: config.orderBy
      })
    });

    // Fetch visibility settings for an item
    const fetchVisibility = async (itemId: string): Promise<VisibilityRecord[]> => {
      if (!config.visibilityTableName || !config.visibilityForeignKey) {
        return [];
      }

      return fetchFromTable<VisibilityRecord>(config.visibilityTableName, {
        filter: { column: config.visibilityForeignKey, value: itemId }
      });
    };

    // Create item mutation
    const createMutation = useMutation({
      mutationFn: async (params: {
        formData: TFormData;
        visibilityModules?: string[];
        visibilityBundles?: string[];
      }) => {
        const insertData = config.transformToInsert 
          ? config.transformToInsert(params.formData)
          : (params.formData as unknown as Record<string, unknown>);

        const createdItem = await insertIntoTable<TItem>(config.tableName, insertData);

        // Add visibility settings if applicable
        if (config.visibilityTableName && config.visibilityForeignKey) {
          const visibilityRecords = [
            ...(params.visibilityModules || []).map(moduleId => ({
              [config.visibilityForeignKey!]: createdItem.id,
              module_id: moduleId,
              bundle_id: null
            })),
            ...(params.visibilityBundles || []).map(bundleId => ({
              [config.visibilityForeignKey!]: createdItem.id,
              module_id: null,
              bundle_id: bundleId
            }))
          ];

          if (visibilityRecords.length > 0) {
            await insertManyIntoTable(config.visibilityTableName, visibilityRecords);
          }
        }

        return createdItem;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [config.queryKey] });
        queryClient.invalidateQueries({ queryKey: [config.userQueryKey || `user-${config.queryKey}`] });
        toast({ title: config.messages.createSuccess });
      },
      onError: (error: Error) => {
        toast({
          title: config.messages.createError,
          description: error.message,
          variant: 'destructive'
        });
      }
    });

    // Update item mutation
    const updateMutation = useMutation({
      mutationFn: async (params: {
        id: string;
        formData: TFormData;
        visibilityModules?: string[];
        visibilityBundles?: string[];
      }) => {
        const updateData = config.transformToUpdate
          ? config.transformToUpdate(params.formData)
          : (params.formData as unknown as Record<string, unknown>);

        const updatedItem = await updateInTable<TItem>(config.tableName, params.id, updateData);

        // Update visibility settings if applicable
        if (config.visibilityTableName && config.visibilityForeignKey) {
          // Delete existing
          await deleteFromTableWhere(config.visibilityTableName, config.visibilityForeignKey, params.id);

          // Insert new
          const visibilityRecords = [
            ...(params.visibilityModules || []).map(moduleId => ({
              [config.visibilityForeignKey!]: params.id,
              module_id: moduleId,
              bundle_id: null
            })),
            ...(params.visibilityBundles || []).map(bundleId => ({
              [config.visibilityForeignKey!]: params.id,
              module_id: null,
              bundle_id: bundleId
            }))
          ];

          if (visibilityRecords.length > 0) {
            await insertManyIntoTable(config.visibilityTableName, visibilityRecords);
          }
        }

        return updatedItem;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [config.queryKey] });
        queryClient.invalidateQueries({ queryKey: [config.userQueryKey || `user-${config.queryKey}`] });
        toast({ title: config.messages.updateSuccess });
      },
      onError: (error: Error) => {
        toast({
          title: config.messages.updateError,
          description: error.message,
          variant: 'destructive'
        });
      }
    });

    // Delete item mutation
    const deleteMutation = useMutation({
      mutationFn: (id: string) => deleteFromTable(config.tableName, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [config.queryKey] });
        queryClient.invalidateQueries({ queryKey: [config.userQueryKey || `user-${config.queryKey}`] });
        toast({ title: config.messages.deleteSuccess });
      },
      onError: (error: Error) => {
        toast({
          title: config.messages.deleteError,
          description: error.message,
          variant: 'destructive'
        });
      }
    });

    // Toggle active status mutation
    const toggleActiveMutation = useMutation({
      mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
        updateInTable(config.tableName, id, { is_active }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [config.queryKey] });
        queryClient.invalidateQueries({ queryKey: [config.userQueryKey || `user-${config.queryKey}`] });
      },
      onError: (error: Error) => {
        toast({
          title: config.messages.toggleError,
          description: error.message,
          variant: 'destructive'
        });
      }
    });

    return {
      allItems,
      userItems,
      itemsLoading,
      userItemsLoading,
      fetchVisibility,
      createItem: createMutation.mutate,
      updateItem: updateMutation.mutate,
      deleteItem: deleteMutation.mutate,
      toggleItemActive: toggleActiveMutation.mutate,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending
    };
  };
}

// Re-export existing hooks that use this pattern
export * from './useCalendarData';
export * from './useAnnouncementsData';
