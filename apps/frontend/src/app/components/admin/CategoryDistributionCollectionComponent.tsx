'use client';

import { PieChart } from 'react-minimal-pie-chart';
import { getAllCampaignsMinimal } from '@/lib/queries/getAllCampaignsMinimal';
import { groupCampaignsByCategory } from '@/lib/utility';
import { useQuery } from "@tanstack/react-query";
import { Loading } from '../common/Loading';


// Category Distribution Component
const CategoryDistributionComponent = () => {
  const { data, error, isLoading } = useQuery<{campaigns: {id: string, category: string}[]}>({
    queryKey: ["category-distribution"],
    queryFn: (): any => {
      return getAllCampaignsMinimal();
    }
  });

  if (isLoading) return <Loading />;


  if (error) return <div>Error: {error.message}</div>


  let groupedData: { title: string, value: number, color: string }[] = [];
  if (data) {
    groupedData = groupCampaignsByCategory(data);
  }
 




  return (
    <div className="max-w-2xl w-full mx-auto bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-extrabold text-indigo-600 mb-4">Campaign Categories Distribution</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 p-4 bg-indigo-50 rounded-lg flex justify-center items-center">
          <PieChart
            data={groupedData}
            label={({ dataEntry }) => `${Math.round((dataEntry.value / groupedData.reduce((a,b)=>a+b.value,0))*100)}%`}
            labelStyle={{ fontSize: '5px', fontWeight: 'bold', fill: '#333' }}
            radius={40}
            labelPosition={70}
            lineWidth={30}
          />
        </div>
        <div className="flex-1 p-4 bg-white rounded-lg space-y-2">
          {groupedData.map((category) => (
            <div key={category.title} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-gray-700 font-medium">
                {category.title} ({category.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryDistributionComponent;