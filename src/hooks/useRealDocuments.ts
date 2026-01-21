import { useState, useEffect } from 'react'
import { supabase, type Document } from '../lib/supabase'
import { useUserManagement } from '../hooks'

export const useDocuments = () => {
  const { userProfile } = useUserManagement()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (file: File, metadata: {
    category: string
    expiryDate?: string
    tags: string[]
    description?: string
  }) => {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Insert document record
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          category: metadata.category,
          expiry_date: metadata.expiryDate || null,
          size: file.size,
          status: 'Active',
          file_path: filePath,
          tags: metadata.tags,
          description: metadata.description || null,
          organization_id: userProfile?.organization_id || null
        })
        .select()
        .single()

      if (insertError) throw insertError

      setDocuments(prev => [data, ...prev])
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Upload failed')
    }
  }

  const updateDocument = async (id: string, updates: {
    category?: string
    expiry_date?: string | null
    tags?: string[]
    description?: string | null
  }) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setDocuments(prev => prev.map(doc => doc.id === id ? data : doc))
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Update failed')
    }
  }

  const deleteDocument = async (id: string, filePath: string) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete document record
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setDocuments(prev => prev.filter(doc => doc.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Delete failed')
    }
  }

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Download failed')
    }
  }

  const readDocumentContent = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath)

      if (error) throw error

      const text = await data.text()
      return text
    } catch (err) {
      console.error('Error reading document content:', err)
      return null
    }
  }

  useEffect(() => {
    if (userProfile) {
      fetchDocuments()
    }
  }, [userProfile])

  return {
    documents,
    loading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    readDocumentContent,
    refetch: fetchDocuments
  }
}