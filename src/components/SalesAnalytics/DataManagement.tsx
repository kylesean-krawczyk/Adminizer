import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { Download, Trash2, Upload, Calendar, Database } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { CustomerDataSyncService } from '../../services/customerDataSyncService';
import { CustomerData } from '../../types';
import { formatNumber } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';

interface DataManagementProps {
  customerData: CustomerData[];
  onDataCleared: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ customerData, onDataCleared }) => {
  const uploadHistory = DataStorage.getUploadHistory();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [unprocessedCount, setUnprocessedCount] = useState<number>(0);

  // Check for unprocessed documents on component mount
  React.useEffect(() => {
    checkUnprocessedDocuments();
  }, []);

  const checkUnprocessedDocuments = async () => {
    const count = await CustomerDataSyncService.getUnprocessedCount();
    setUnprocessedCount(count);
  };

  const handleSyncFromDocuments = async () => {
    setSyncLoading(true);
    setSyncStatus('Syncing customer data from document center...');
    
    const result = await CustomerDataSyncService.syncCustomerDataFromDocuments();
    
    if (result.success) {
      if (result.processedCount > 0) {
        setSyncStatus(`Successfully synced ${result.processedCount} document(s) with ${result.totalCustomersAdded} customer records`);
        // Trigger a page refresh or data reload
        window.location.reload();
      } else {
        setSyncStatus('No new customer data documents found to sync');
      }
    } else {
      setSyncStatus(`Sync failed: ${result.error}`);
    }
    
    setSyncLoading(false);
    await checkUnprocessedDocuments();
    
    // Clear status after 5 seconds
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all customer data? This action cannot be undone.')) {
      DataStorage.clearData();
      onDataCleared();
    }
  };

  const handleExportData = () => {
    // Export as CSV for better compatibility
    const csvHeader = 'First Name,Last Name,Email,Phone,Total Amount,Sale Count,Average Sale,First Sale,Last Sale,Frequency\n';
    const csvData = customerData.map(customer => [
      customer.firstName,
      customer.lastName,
      customer.email || '',
      customer.phone || '',
      customer.totalAmount,
      customer.saleCount,
      customer.averageSale.toFixed(2),
      formatDate(customer.firstSale, 'yyyy-MM-dd'),
      formatDate(customer.lastSale, 'yyyy-MM-dd'),
      customer.purchaseFrequency
    ].join(',')).join('\n');
    
    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `customer-data-export-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      {syncStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">{syncStatus}</p>
        </div>
      )}

      {/* Document Center Sync */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Document Center Integration</h3>
          </div>
          <button
            onClick={handleSyncFromDocuments}
            disabled={syncLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>{syncLoading ? 'Syncing...' : 'Sync from Documents'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">Unprocessed Documents</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(unprocessedCount)}</p>
            <p className="text-xs text-gray-600 mt-1">
              Documents with "Customer Data" category awaiting processing
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Auto-Sync Status</p>
            <p className="text-lg font-bold text-green-900">Enabled</p>
            <p className="text-xs text-green-600 mt-1">
              New uploads are automatically detected and processed
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Upload CSV files through the main document center using the "Customer Data" category. 
            The system automatically detects and processes these files for analytics. Click "Sync from Documents\" to manually 
            check for new uploads.
          </p>
        </div>
      </div>

      {/* Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Overview</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Total Customers</p>
            <p className="text-2xl font-bold text-blue-900">{formatNumber(customerData.length)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Total Sales</p>
            <p className="text-2xl font-bold text-green-900">
              {formatNumber(customerData.reduce((sum, customer) => sum + customer.saleCount, 0))}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-800">Data Uploads</p>
            <p className="text-2xl font-bold text-purple-900">{formatNumber(uploadHistory.length)}</p>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upload History</h3>
          </div>
        </div>

        {uploadHistory.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadHistory.slice().reverse().map((upload, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(upload.date, 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Added {formatNumber(upload.recordsAdded)} records
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">
                    Total: {formatNumber(upload.totalRecords)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No upload history available</p>
        )}
      </div>

      {/* Data Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          
          <button
            onClick={handleClearData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Data is stored locally in your browser and encrypted for security. 
            Regular exports are recommended for backup purposes.
          </p>
        </div>
      </div>
    </div>
  );
};