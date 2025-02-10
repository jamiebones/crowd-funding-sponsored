'use client';

import { PieChart } from 'react-minimal-pie-chart';
import { getAllCampaignsMinimal } from '@/lib/queries/getAllCampaignsMinimal';
import { getCampaignCategories, groupCampaignsByCategory } from '@/lib/utility';
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-1">Campaign Categories Distribution</h2>
      <div className="flex justify-between items-center">
        <div className="w-3/4 p-2">
          <PieChart
            data={groupedData}
            label={({ dataEntry }) => `${dataEntry.title}`}
            labelStyle={{ fontSize: '2px' }}
            radius={20}
            labelPosition={105}
            lineWidth={20}
          />
        </div>
        <div className="w-1/4">
          {groupedData.map((category) => (
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