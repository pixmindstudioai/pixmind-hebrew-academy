import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaterialsFolder {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialsFile {
  id: string;
  folder_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  order_index: number;
  created_at: string;
}

export interface MaterialsFolderAccess {
  id: string;
  folder_id: string;
  module_id: string | null;
  bundle_id: string | null;
  created_at: string;
}

// Admin hooks
export const useAdminMaterialsFolders = () => {
  return useQuery({
    queryKey: ["admin-materials-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials_folders")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as MaterialsFolder[];
    },
  });
};

export const useAdminMaterialsFiles = (folderId: string | null) => {
  return useQuery({
    queryKey: ["admin-materials-files", folderId],
    queryFn: async () => {
      if (!folderId) return [];
      
      const { data, error } = await supabase
        .from("materials_files")
        .select("*")
        .eq("folder_id", folderId)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as MaterialsFile[];
    },
    enabled: !!folderId,
  });
};

export const useFolderAccess = (folderId: string | null) => {
  return useQuery({
    queryKey: ["folder-access", folderId],
    queryFn: async () => {
      if (!folderId) return [];
      
      const { data, error } = await supabase
        .from("materials_folder_access")
        .select("*")
        .eq("folder_id", folderId);
      
      if (error) throw error;
      return data as MaterialsFolderAccess[];
    },
    enabled: !!folderId,
  });
};

// Mutations
export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from("materials_folders")
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials-folders"] });
      toast.success("התיקייה נוצרה בהצלחה");
    },
    onError: (error: Error) => {
      console.error("Folder creation error:", error);
      toast.error(`שגיאה ביצירת התיקייה: ${error?.message || "שגיאה לא ידועה"}`);
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MaterialsFolder> & { id: string }) => {
      const { error } = await supabase
        .from("materials_folders")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials-folders"] });
      toast.success("התיקייה עודכנה בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון התיקייה");
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("materials_folders")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials-folders"] });
      toast.success("התיקייה נמחקה בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה במחיקת התיקייה");
    },
  });
};

export const useUploadMaterialFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ folderId, file }: { folderId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folderId}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get file type
      const fileType = getFileType(file.name);
      
      // Create record in database
      const { data, error } = await supabase
        .from("materials_files")
        .insert({
          folder_id: folderId,
          file_name: file.name,
          file_url: fileName,
          file_type: fileType,
          file_size: file.size,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials-files", variables.folderId] });
      toast.success("הקובץ הועלה בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בהעלאת הקובץ");
    },
  });
};

export const useDeleteMaterialFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, fileUrl, folderId }: { id: string; fileUrl: string; folderId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("materials")
        .remove([fileUrl]);
      
      if (storageError) console.error("Storage delete error:", storageError);
      
      // Delete from database
      const { error } = await supabase
        .from("materials_files")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return folderId;
    },
    onSuccess: (folderId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials-files", folderId] });
      toast.success("הקובץ נמחק בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה במחיקת הקובץ");
    },
  });
};

export const useSetFolderAccess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      folderId, 
      moduleIds, 
      bundleIds 
    }: { 
      folderId: string; 
      moduleIds: string[]; 
      bundleIds: string[]; 
    }) => {
      // Delete existing access
      await supabase
        .from("materials_folder_access")
        .delete()
        .eq("folder_id", folderId);
      
      // Insert new access records
      const accessRecords = [
        ...moduleIds.map(moduleId => ({ folder_id: folderId, module_id: moduleId })),
        ...bundleIds.map(bundleId => ({ folder_id: folderId, bundle_id: bundleId })),
      ];
      
      if (accessRecords.length > 0) {
        const { error } = await supabase
          .from("materials_folder_access")
          .insert(accessRecords);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folder-access", variables.folderId] });
      toast.success("הרשאות התיקייה עודכנו");
    },
    onError: () => {
      toast.error("שגיאה בעדכון ההרשאות");
    },
  });
};

// User hooks - Get materials for a specific module
export const useModuleMaterials = (moduleId: string | undefined) => {
  return useQuery({
    queryKey: ["module-materials", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      
      // Get folders accessible to this module (directly or via bundle)
      const { data: accessData, error: accessError } = await supabase
        .from("materials_folder_access")
        .select(`
          folder_id,
          module_id,
          bundle_id
        `)
        .or(`module_id.eq.${moduleId}`);
      
      if (accessError) throw accessError;
      
      // Also check if the module is part of any bundle and get those folders
      const { data: bundleData } = await supabase
        .from("bundle_modules")
        .select("bundle_id")
        .eq("module_id", moduleId);
      
      const bundleIds = bundleData?.map(b => b.bundle_id) || [];
      
      let allAccessData = accessData || [];
      
      if (bundleIds.length > 0) {
        const { data: bundleAccessData } = await supabase
          .from("materials_folder_access")
          .select("folder_id, module_id, bundle_id")
          .in("bundle_id", bundleIds);
        
        if (bundleAccessData) {
          allAccessData = [...allAccessData, ...bundleAccessData];
        }
      }
      
      const folderIds = [...new Set(allAccessData.map(a => a.folder_id))];
      
      if (folderIds.length === 0) return [];
      
      // Get active folders
      const { data: folders, error: foldersError } = await supabase
        .from("materials_folders")
        .select("*")
        .in("id", folderIds)
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      
      if (foldersError) throw foldersError;
      
      return folders as MaterialsFolder[];
    },
    enabled: !!moduleId,
  });
};

export const useFolderFiles = (folderId: string | null) => {
  return useQuery({
    queryKey: ["folder-files", folderId],
    queryFn: async () => {
      if (!folderId) return [];
      
      const { data, error } = await supabase
        .from("materials_files")
        .select("*")
        .eq("folder_id", folderId)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as MaterialsFile[];
    },
    enabled: !!folderId,
  });
};

// Utility function to get file download URL
export const getFileDownloadUrl = async (fileUrl: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from("materials")
    .createSignedUrl(fileUrl, 3600); // 1 hour expiry
  
  if (error) {
    console.error("Error getting signed URL:", error);
    return null;
  }
  
  return data.signedUrl;
};

// Helper function to determine file type
function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const typeMap: Record<string, string> = {
    pdf: 'pdf',
    doc: 'docx',
    docx: 'docx',
    xls: 'xlsx',
    xlsx: 'xlsx',
    ppt: 'pptx',
    pptx: 'pptx',
    zip: 'zip',
    rar: 'zip',
    '7z': 'zip',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    webp: 'image',
    svg: 'image',
  };
  
  return typeMap[ext] || 'other';
}

// Get file icon based on type
export function getFileIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    xlsx: '📊',
    pptx: '📽️',
    zip: '📦',
    image: '🖼️',
    other: '📁',
  };
  
  return iconMap[fileType] || '📁';
}

// Format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
