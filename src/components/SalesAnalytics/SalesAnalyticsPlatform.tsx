import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { Dashboard } from './AISalesDashboard';
import { SecurityInfo } from './SecurityInfo';
import { EconomicIndicators } from './EconomicIndicators';
import { DataManagement } from './DataManagement';
import { AllCustomersDirectory } from './AllCustomersDirectory';
import { DataStorage } from '../../utils/dataStorage';
import { SalesAnalytics } from '../../utils/analytics';
import { CustomerData, SalesAnalysisResult } from '../../types';
import { CustomerDataSyncService } from '../../services/customerDataSyncService';
import { BarChart3, Shield, TrendingUp, Upload, Database, Users } from 'lucide-react';

function SalesAnalyticsPlatform() {
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [analysis, setAnalysis] = useState<SalesAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'security' | 'economic' | 'data' | 'customers'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Load existing data on component mount
  React.useEffect(() => {
    loadAndSyncData();
  }, []);

  const loadAndSyncData = async () => {
    setIsLoading(true);
    setSyncStatus('Loading existing data...');
    
    // Load existing data from local storage
    const existingData = DataStorage.loadData();
    
    // Check for new customer data documents to sync
    setSyncStatus('Checking for new customer data documents...');
    const syncResult = await CustomerDataSyncService.syncCustomerDataFromDocuments();
    
    if (syncResult.success && syncResult.processedCount > 0) {
      setSyncStatus(`Synced ${syncResult.processedCount} new document(s) with ${syncResult.totalCustomersAdded} customer records`);
      
      // Reload data after sync
      const updatedData = DataStorage.loadData();
      setCustomerData(updatedData);
      
      if (updatedData.length > 0) {
        const analysisResult = SalesAnalytics.analyzeData(updatedData);
        setAnalysis(analysisResult);
        setActiveTab('dashboard');
      }
    } else if (syncResult.error) {
      setSyncStatus(`Sync error: ${syncResult.error}`);
      // Still load existing data even if sync failed
      setCustomerData(existingData);
      if (existingData.length > 0) {
        const analysisResult = SalesAnalytics.analyzeData(existingData);
        setAnalysis(analysisResult);
        setActiveTab('dashboard');
      }
    } else {
      setSyncStatus(null);
      setCustomerData(existingData);
      if (existingData.length > 0) {
        const analysisResult = SalesAnalytics.analyzeData(existingData);
        setAnalysis(analysisResult);
        setActiveTab('dashboard');
      }
    }
    
    setIsLoading(false);
    
    // Clear sync status after 5 seconds
    if (syncResult.success && syncResult.processedCount > 0) {
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    setSyncStatus('Manually syncing customer data...');
    
    const syncResult = await CustomerDataSyncService.syncCustomerDataFromDocuments();
    
    if (syncResult.success) {
      if (syncResult.processedCount > 0) {
        setSyncStatus(`Successfully synced ${syncResult.processedCount} document(s) with ${syncResult.totalCustomersAdded} new customer records`);
        
        // Reload data
        const updatedData = DataStorage.loadData();
        setCustomerData(updatedData);
        const analysisResult = SalesAnalytics.analyzeData(updatedData);
        setAnalysis(analysisResult);
      } else {
        setSyncStatus('No new customer data documents found to sync');
      }
    } else {
      setSyncStatus(`Sync failed: ${syncResult.error}`);
    }
    
    setIsLoading(false);
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const handleDataLoaded = (data: CustomerData[]) => {
    setIsLoading(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      // Merge new data with existing data
      const existingData = DataStorage.loadData();
      const mergedData = DataStorage.mergeNewData(existingData, data);
      
      // Save merged data
      DataStorage.saveData(mergedData);
      DataStorage.saveUploadHistory(data.length, mergedData.length);
      
      // Update state
      setCustomerData(mergedData);
      const analysisResult = SalesAnalytics.analyzeData(mergedData);
      setAnalysis(analysisResult);
      setActiveTab('dashboard');
      setIsLoading(false);
    }, 1000);
  };

  const handleDataCleared = () => {
    setCustomerData([]);
    setAnalysis(null);
    setActiveTab('upload');
  };

  const tabs = [
    { id: 'upload', label: 'Upload Data', icon: <Upload className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'customers', label: 'All Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'data', label: 'Data Management', icon: <Database className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'economic', label: 'Economic Insights', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <p className="text-blue-800 font-medium">{syncStatus}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">
              {syncStatus || 'Analyzing customer data...'}
            </span>
          </div>
        )}

        {!isLoading && (
          <>
            {activeTab === 'upload' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {customerData.length > 0 ? 'Add More Customer Data' : 'Upload Your Customer Data'}
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    {customerData.length > 0 
                      ? `Add new sales records to your existing database of ${customerData.length} customers. New data will be merged with existing records.`
                      : 'Import your customer database to unlock powerful insights about sales patterns, retention rates, and future revenue opportunities. You can also upload customer data through the main document center using the "Customer Data" category.'
                    }
                  </p>
                </div>
                <FileUpload onDataLoaded={handleDataLoaded} isLoading={isLoading} />
                
                {customerData.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-green-800 text-center">
                      {customerData.length} customers with {customerData.reduce((sum, customer) => sum + customer.saleCount, 0)} total sales
                    </p>
                  </div>
                )}
                
                {/* Sync from Document Center */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Sync from Document Center</h3>
                      <p className="text-sm text-gray-600">
                        Import customer data files uploaded through Adminizer's main document center
                      </p>
                    </div>
                    <button
                      onClick={handleManualSync}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Database className="w-4 h-4" />
                      <span>Sync Now</span>
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">How it works:</h4>
                        <ul className="mt-1 text-sm text-blue-800 space-y-1">
                          <li>• Upload CSV files through the main document center with category "Customer Data"</li>
                          <li>• Files are automatically detected and processed for analytics</li>
                          <li>• Data is merged with your existing customer database</li>
                          <li>• Click "Sync Now" to manually check for new uploads</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && analysis && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Sales Analytics Dashboard
                  </h2>
                  <p className="text-gray-600">
                    Comprehensive insights from {customerData.length} customer records
                  </p>
                </div>
                <Dashboard analysis={analysis} customerData={customerData} />
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    All Customers Directory
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Complete directory of all {customerData.length} customers, organized by total purchase amount. 
                    View detailed customer profiles and purchase history.
                  </p>
                </div>
                <AllCustomersDirectory customers={customerData} />
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Data Management
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Manage your customer database, view upload history, and export data for backup or analysis.
                  </p>
                </div>
                <DataManagement customerData={customerData} onDataCleared={handleDataCleared} />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Security & Compliance
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Essential security measures and compliance requirements for protecting 
                    sensitive customer information.
                  </p>
                </div>
                <SecurityInfo />
              </div>
            )}

            {activeTab === 'economic' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Economic Market Insights
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Leverage economic indicators to optimize sales timing and 
                    improve revenue forecasting accuracy.
                  </p>
                </div>
                <EconomicIndicators />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default SalesAnalyticsPlatform;