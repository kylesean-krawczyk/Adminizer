import React, { useState, useMemo } from 'react';
import { CustomerData } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';
import { Search, Filter, Mail, Phone, DollarSign, ShoppingCart, User } from 'lucide-react';

interface AllCustomersDirectoryProps {
  customers: CustomerData[];
}

export const AllCustomersDirectory: React.FC<AllCustomersDirectoryProps> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalAmount' | 'saleCount' | 'averageSale' | 'lastSale' | 'name'>('totalAmount');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'frequent' | 'regular' | 'occasional' | 'one-time'>('all');

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' || customer.purchaseFrequency === filterBy;
      
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'saleCount':
          aValue = a.saleCount;
          bValue = b.saleCount;
          break;
        case 'averageSale':
          aValue = a.averageSale;
          bValue = b.averageSale;
          break;
        case 'lastSale':
          aValue = a.lastSale.getTime();
          bValue = b.lastSale.getTime();
          break;
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        default:
          aValue = a.totalAmount;
          bValue = b.totalAmount;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [customers, searchTerm, sortBy, sortOrder, filterBy]);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'frequent': return 'bg-green-100 text-green-800';
      case 'regular': return 'bg-blue-100 text-blue-800';
      case 'occasional': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="totalAmount">Total Amount</option>
              <option value="saleCount">Number of Purchases</option>
              <option value="averageSale">Average Purchase</option>
              <option value="lastSale">Last Purchase</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Filter By Frequency */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Customers</option>
            <option value="frequent">Frequent</option>
            <option value="regular">Regular</option>
            <option value="occasional">Occasional</option>
            <option value="one-time">One-time</option>
          </select>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredAndSortedCustomers.length} of {customers.length} customers
          </span>
          <span>
            Total: {formatCurrency(filteredAndSortedCustomers.reduce((sum, customer) => sum + customer.totalAmount, 0))}
          </span>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="p-6">
        {filteredAndSortedCustomers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No customers found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCustomers.map((customer) => (
              <div key={customer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Customer Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                      {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(customer.purchaseFrequency)}`}>
                        {customer.purchaseFrequency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {customer.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Purchase Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-900">
                      {formatCurrency(customer.totalAmount)}
                    </p>
                    <p className="text-xs text-green-600">Total Spent</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-blue-900">
                      {formatNumber(customer.saleCount)}
                    </p>
                    <p className="text-xs text-blue-600">Purchases</p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Purchase:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(customer.averageSale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Purchase:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(customer.firstSale, 'MMM yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Purchase:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(customer.lastSale, 'MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};