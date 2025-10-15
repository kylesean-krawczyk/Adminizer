import { CustomerData } from '../types';
import { encryptData, decryptData } from './helpers';

const STORAGE_KEY = 'customer_analytics_data';
const ENCRYPTION_KEY = 'customer_data_key_2024'; // In production, this should be user-specific

export class DataStorage {
  static saveData(customers: CustomerData[]): void {
    try {
      const dataString = JSON.stringify(customers);
      const encryptedData = encryptData(dataString, ENCRYPTION_KEY);
      localStorage.setItem(STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to save customer data:', error);
    }
  }

  static loadData(): CustomerData[] {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) return [];

      const dataString = decryptData(encryptedData, ENCRYPTION_KEY);
      const data = JSON.parse(dataString);
      
      // Convert date strings back to Date objects
      return data.map((customer: any) => ({
        ...customer,
        firstSale: new Date(customer.firstSale),
        lastSale: new Date(customer.lastSale),
        sales: customer.sales.map((sale: any) => ({
          ...sale,
          date: new Date(sale.date)
        }))
      }));
    } catch (error) {
      console.error('Failed to load customer data:', error);
      return [];
    }
  }

  static clearData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static mergeNewData(existingCustomers: CustomerData[], newCustomers: CustomerData[]): CustomerData[] {
    const customerMap = new Map<string, CustomerData>();

    // Add existing customers to map
    existingCustomers.forEach(customer => {
      const key = this.getCustomerKey(customer.firstName, customer.lastName);
      customerMap.set(key, { ...customer });
    });

    // Merge new customers
    newCustomers.forEach(newCustomer => {
      const key = this.getCustomerKey(newCustomer.firstName, newCustomer.lastName);
      
      if (customerMap.has(key)) {
        const existingCustomer = customerMap.get(key)!;
        
        // Merge sales, avoiding duplicates
        const existingSaleIds = new Set(existingCustomer.sales.map(s => s.id));
        const newSales = newCustomer.sales.filter(s => !existingSaleIds.has(s.id));
        
        // Check for potential duplicates by date and amount
        const filteredNewSales = newSales.filter(newSale => {
          return !existingCustomer.sales.some(existingSale => 
            existingSale.date.getTime() === newSale.date.getTime() &&
            existingSale.amount === newSale.amount
          );
        });

        if (filteredNewSales.length > 0) {
          existingCustomer.sales.push(...filteredNewSales);
          this.recalculateCustomerMetrics(existingCustomer);
        }

        // Update contact info if new data has it and existing doesn't
        if (!existingCustomer.email && newCustomer.email) {
          existingCustomer.email = newCustomer.email;
        }
        if (!existingCustomer.phone && newCustomer.phone) {
          existingCustomer.phone = newCustomer.phone;
        }
      } else {
        customerMap.set(key, newCustomer);
      }
    });

    return Array.from(customerMap.values());
  }

  private static getCustomerKey(firstName: string, lastName: string): string {
    return `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}`;
  }

  private static recalculateCustomerMetrics(customer: CustomerData): void {
    // Sort sales by date
    customer.sales.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Recalculate metrics
    customer.totalAmount = customer.sales.reduce((sum, s) => sum + s.amount, 0);
    customer.saleCount = customer.sales.length;
    customer.averageSale = customer.totalAmount / customer.saleCount;
    customer.firstSale = customer.sales[0].date;
    customer.lastSale = customer.sales[customer.sales.length - 1].date;
    customer.purchaseFrequency = this.calculatePurchaseFrequency(customer.saleCount);
  }

  private static calculatePurchaseFrequency(count: number): CustomerData['purchaseFrequency'] {
    if (count === 1) return 'one-time';
    if (count <= 3) return 'occasional';
    if (count <= 6) return 'regular';
    return 'frequent';
  }

  static getUploadHistory(): Array<{ date: Date; recordsAdded: number; totalRecords: number }> {
    try {
      const historyData = localStorage.getItem(`${STORAGE_KEY}_history`);
      if (!historyData) return [];
      
      const history = JSON.parse(historyData);
      return history.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      }));
    } catch {
      return [];
    }
  }

  static saveUploadHistory(recordsAdded: number, totalRecords: number): void {
    try {
      const history = this.getUploadHistory();
      history.push({
        date: new Date(),
        recordsAdded,
        totalRecords
      });
      
      // Keep only last 50 uploads
      const recentHistory = history.slice(-50);
      localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to save upload history:', error);
    }
  }
}