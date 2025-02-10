'use client';

import { PieChart } from 'react-minimal-pie-chart';

// Dummy data for categories
const categoryData = [
  { title: 'Health', value: 39, color: '#FF6384' },
  { title: 'Education', value: 25, color: '#36A2EB' },
  { title: 'Technology', value: 18, color: '#FFCE56' },
  { title: 'Environment', value: 15, color: '#4BC0C0' },
  { title: 'Arts', value: 12, color: '#9966FF' },
];




// Category Distribution Component
const CategoryDistributionComponent = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Campaign Categories Distribution</h2>
      <div className="flex justify-between items-center">
        <div className="w-3/4 p-6">
          <PieChart
            data={categoryData}
            label={({ dataEntry }) => `${dataEntry.title}`}
            labelStyle={{ fontSize: '4px' }}
            radius={30}
            labelPosition={105}
          />
        </div>
        <div className="w-1/4">
          {categoryData.map((category) => (
            <div key={category.title} className="flex items-center mb-2">
              <div
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-gray-700">
                {category.title}: {category.value} projects
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryDistributionComponent;