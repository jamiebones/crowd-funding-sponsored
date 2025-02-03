import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { isPdf } from '@/lib/utility';

interface CampaignCardProps {
  campaign: {
    content: {
      media: string[];
      title: string;
      details: string;
    };
    dateCreated: string;
    contractAddress: string;
    projectDuration: number;
    backers: number;
    category: number;
    amountSought: string;
    amountRaised: string;
    id: string;
    owner: {
      id: string;
    };
  };
}

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const timeAgo = formatDistance(new Date(+campaign.dateCreated * 1000), new Date(), { addSuffix: true });

  
  return (
    <Link 
      href={`/user/projects/${campaign.id}`}
      target="_blank"
      className="block overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      {campaign.content.media.map((mediaItem, index) => (
    <div key={index} className="h-48 min-w-full flex-shrink-0">
      {isPdf(mediaItem) ? (
        <div className="relative h-full w-full">
          <iframe
            src={`${mediaItem.split(":")[0]}#view=FitH`}
            className="absolute w-full h-full"
            title={`PDF preview for ${campaign.content.title}`}
          />
        </div>
      ) : (
        <img
          src={`https://arweave.net/${mediaItem.split(":")[0]}`}
          alt={`${campaign.content.title} - Image ${index + 1}`}
          className="w-full h-full object-contain"
          width={100}
          height={100}
        />
      )}
    </div>
  ))}
  
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
          {campaign.content.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {campaign.content.details.length > 200 
            ? `${campaign.content.details.substring(0, 200)}...` 
            : campaign.content.details}
        </p>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {timeAgo}
          </div>
          <div className="text-sm font-medium text-blue-600">
            {campaign.backers} backers
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ 
                width: `${Math.min((Number(+campaign.amountRaised / 10 ** 18) / Number(+campaign.amountSought / 10 ** 18)) * 100, 100)}%` 
              }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">
              {Number(+campaign.amountRaised / 10 ** 18)} BNB raised
            </span>
            <span className="text-gray-500">
              of {Number(+campaign.amountSought / 10 ** 18)} BNB
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};