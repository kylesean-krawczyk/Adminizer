import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CustomerRetentionData } from '../../types';
import { formatPercentage } from '../../utils/helpers';

interface RetentionChartProps {
  data: CustomerRetentionData;
}

export const RetentionChart: React.FC<RetentionChartProps> = ({ data }) => {
  // Calculate total for percentage calculation
  const total = data.returningCustomers + data.newCustomers;
  
  const chartData = [
    { 
      name: 'Returning Customers', 
      value: total > 0 ? data.returningCustomers / total : 0, 
      count: data.returningCustomers,
      absoluteValue: data.returningCustomers
    },
    { 
      name: 'New Customers', 
      value: total > 0 ? data.newCustomers / total : 0, 
      count: data.newCustomers,
      absoluteValue: data.newCustomers
    }
  ];

  const COLORS = ['#059669', '#3b82f6'];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value} (${formatPercentage(value ?? 0)})`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${props.payload.absoluteValue} customers (${formatPercentage(value)})`,
              name
            ]}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};