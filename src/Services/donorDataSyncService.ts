import { supabase } from '../lib/supabase'
import { DataParser } from '../utils/dataParser'
import { DataStorage } from '../utils/dataStorage'
import { isDemoMode } from '../lib/demo'

export class DonorDataSyncService {
  /**
   * Synchronizes donor data from documents uploaded to the main document center
   * with the donor analytics platform
   */
  static async syncDonorDataFromDocuments(): Promise<{
    success: boolean
    processedCount: number
    totalDonorsAdded: number
    error?: string
  }> {
    try {
      if (isDemoMode) {
        // In demo mode, simulate sync but don't actually process
        return {
          success: true,
          processedCount: 0,
          totalDonorsAdded: 0
        }
      }

      // Query for unprocessed donor data documents
      const { data: documents, error: queryError } = await supabase
        .from('documents')
        .select('*')
        .eq('category', 'Donor Data')
        .eq('is_donor_data_processed', false)
        .order('created_at', { ascending: true })

      if (queryError) {
        throw new Error(`Failed to query documents: ${queryError.message}`)
      }

      if (!documents || documents.length === 0) {
        return {
          success: true,
          processedCount: 0,
          totalDonorsAdded: 0
        }
      }

      let totalDonorsAdded = 0
      const processedDocumentIds: string[] = []

      // Process each unprocessed document
      for (const document of documents) {
        try {
          // Download and read the document content
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(document.file_path)

          if (downloadError) {
            console.error(`Failed to download document ${document.name}:`, downloadError)
            continue
          }

          // Convert blob to file for DataParser
          const file = new File([fileData], document.name, { type: 'text/csv' })
          
          // Parse the CSV data
          const parseResult = await DataParser.parseFile(file)
          
          if (parseResult.success && parseResult.data) {
            // Merge with existing donor data in local storage
            const existingData = DataStorage.loadData()
            const mergedData = DataStorage.mergeNewData(existingData, parseResult.data)
            
            // Save the merged data
            DataStorage.saveData(mergedData)
            DataStorage.saveUploadHistory(parseResult.data.length, mergedData.length)
            
            totalDonorsAdded += parseResult.data.length
            processedDocumentIds.push(document.id)
            
            console.log(`Successfully processed ${document.name}: ${parseResult.data.length} donors added`)
          } else {
            console.error(`Failed to parse document ${document.name}:`, parseResult.error)
          }
        } catch (error) {
          console.error(`Error processing document ${document.name}:`, error)
        }
      }

      // Mark processed documents as processed
      if (processedDocumentIds.length > 0) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ is_donor_data_processed: true })
          .in('id', processedDocumentIds)

        if (updateError) {
          console.error('Failed to mark documents as processed:', updateError)
          // Don't throw here as the data was still processed successfully
        }
      }

      return {
        success: true,
        processedCount: processedDocumentIds.length,
        totalDonorsAdded
      }
    } catch (error) {
      console.error('Donor data sync error:', error)
      return {
        success: false,
        processedCount: 0,
        totalDonorsAdded: 0,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      }
    }
  }

  /**
   * Check if there are any unprocessed donor data documents
   */
  static async hasUnprocessedDonorData(): Promise<boolean> {
    try {
      if (isDemoMode) {
        return false
      }

      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .eq('category', 'Donor Data')
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

  /**
   * Get count of unprocessed donor data documents
   */
  static async getUnprocessedCount(): Promise<number> {
    try {
      if (isDemoMode) {
        return 0
      }

      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Donor Data')
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