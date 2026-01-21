import React from 'react';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

export const SecurityInfo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Security & Privacy</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Lock className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Data Encryption</p>
            <p className="text-sm text-gray-600">
              All customer data is encrypted using AES-256 encryption both in transit and at rest.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Access Control</p>
            <p className="text-sm text-gray-600">
              Role-based access controls ensure only authorized personnel can view sensitive customer information.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Compliance</p>
            <p className="text-sm text-gray-600">
              Built with GDPR, CCPA, and business data protection standards in mind.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Recommendation:</strong> Implement regular security audits, 
          use secure backup systems, and ensure all staff handling customer data 
          receive proper security training.
        </p>
      </div>
    </div>
  );
};