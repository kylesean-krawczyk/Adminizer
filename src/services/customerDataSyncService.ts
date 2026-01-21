import { supabase } from '../lib/supabase'
import { DataParser } from '../utils/dataParser'
import { DataStorage } from '../utils/dataStorage'
import { isDemoMode } from '../lib/demo'

export class CustomerDataSyncService {
  static async syncCustomerDataFromDocuments(): Promise<{
    success: boolean
    processedCount: number
    totalCustomersAdded: number
    error?: string
  }> {
    try {
      if (isDemoMode) {
        return {
          success: true,
          processedCount: 0,
          totalCustomersAdded: 0
        }
      }

      const { data: documents, error: queryError } = await supabase
        .from('documents')
        .select('*')
        .eq('category', 'Customer Data')
        .eq('is_donor_data_processed', false)
        .order('created_at', { ascending: true })

      if (queryError) {
        throw new Error(`Failed to query documents: ${queryError.message}`)
      }

      if (!documents || documents.length === 0) {
        return {
          success: true,
          processedCount: 0,
          totalCustomersAdded: 0
        }
      }

      let totalCustomersAdded = 0
      const processedDocumentIds: string[] = []

      for (const document of documents) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(document.file_path)

          if (downloadError) {
            console.error(`Failed to download document ${document.name}:`, downloadError)
            continue
          }

          const file = new File([fileData], document.name, { type: 'text/csv' })

          const parseResult = await DataParser.parseFile(file)

          if (parseResult.success && parseResult.data) {
            const existingData = DataStorage.loadData()
            const mergedData = DataStorage.mergeNewData(existingData, parseResult.data)

            DataStorage.saveData(mergedData)
            DataStorage.saveUploadHistory(parseResult.data.length, mergedData.length)

            totalCustomersAdded += parseResult.data.length
            processedDocumentIds.push(document.id)

            console.log(`Successfully processed ${document.name}: ${parseResult.data.length} customers added`)
          } else {
            console.error(`Failed to parse document ${document.name}:`, parseResult.error)
          }
        } catch (error) {
          console.error(`Error processing document ${document.name}:`, error)
        }
      }

      if (processedDocumentIds.length > 0) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ is_donor_data_processed: true })
          .in('id', processedDocumentIds)

        if (updateError) {
          console.error('Failed to mark documents as processed:', updateError)
        }
      }

      return {
        success: true,
        processedCount: processedDocumentIds.length,
        totalCustomersAdded
      }
    } catch (error) {
      console.error('Customer data sync error:', error)
      return {
        success: false,
        processedCount: 0,
        totalCustomersAdded: 0,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      }
    }
  }

  static async hasUnprocessedCustomerData(): Promise<boolean> {
    try {
      if (isDemoMode) {
        return false
      }

      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .eq('category', 'Customer Data')
        .eq('is_donor_data_processed', false)
        .limit(1)

      if (error) {
        console.error('Error checking for unprocessed data:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error checking for unprocessed data:', error)
      return false
    }
  }

  static async getUnprocessedCount(): Promise<number> {
    try {
      if (isDemoMode) {
        return 0
      }

      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Customer Data')
        .eq('is_donor_data_processed', false)

      if (error) {
        console.error('Error getting unprocessed count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error getting unprocessed count:', error)
      return 0
    }
  }
}
