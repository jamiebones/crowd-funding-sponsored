import { categories } from "@/app/constant/categories";
import Campaign from "@/app/interface/Campaign";
import { toast } from "react-toastify";

const isPdf = (url: string = "") => {
  const spString = url.split(":");
  if (spString && spString[1].includes("pdf")) {
    return true;
  }
  return false;
};

const getCampaignCategories = (category: number) => {
  return categories.find((c) => c.value === category)?.name;
}

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Address copied to clipboard!');
};

const filterDonations = (donations: any[], withdrawals: any[]) => {
  // Group withdrawals by donor address
  const withdrawalsByDonor = new Map<string, number[]>();

  withdrawals.forEach(withdrawal => {
    const donorId = withdrawal.donor.id.toLowerCase();
    const withdrawalTime = withdrawal.timestamp;

    if (!withdrawalsByDonor.has(donorId)) {
      withdrawalsByDonor.set(donorId, []);
    }
    withdrawalsByDonor.get(donorId)?.push(withdrawalTime);
  });

  // Filter donations based on withdrawal timestamps
  return donations.filter(donation => {
    const donorId = donation.donor.id.toLowerCase();
    const donationTime = donation.timestamp;

    // If no withdrawals for this donor, show the donation
    if (!withdrawalsByDonor.has(donorId)) {
      return true;
    }
    // Get all withdrawal timestamps for this donor
    const donorWithdrawalTimes = withdrawalsByDonor.get(donorId) || [];
    // Check if donation timestamp is less than any withdrawal timestamp
    // Only keep donations that happened before the earliest withdrawal
    const latestWithdrawal = Math.max(...donorWithdrawalTimes);
    return donationTime > latestWithdrawal;
  });
};

const canWithdrawMilestone = (projectDuration: number, milestoneDate: number) => {
  const currentDate = new Date();
  const projectEndDate = new Date(projectDuration * 1000);
  const milestoneDateWithGracePeriod = new Date((milestoneDate * 1000) + (14 * 24 * 60 * 60 * 1000)); // milestone + 14 days

  return currentDate > projectEndDate && milestoneDateWithGracePeriod < currentDate;
};

const trendingCampaigns = (campaigns: any[]) => {
  let sortedCampaigns = campaigns.sort((a, b) => b.amountRaised - a.amountRaised);
  return sortedCampaigns.slice(0, 20);
};

const categoryColors: Record<string, string> = {
  'TECHNOLOGY': '#FFCE56',
  'ARTS': '#9966FF',
  'COMMUNITY': '#FF9F40',
  'EDUCATION': '#36A2EB',
  'ENVIRONMENT': '#4BC0C0',
  'HEALTH': '#FF6384',
  'SOCIAL': '#C9CBCF',
  'CHARITY': '#7BC043',
  'OTHER': '#999999'
};

const groupCampaignsByCategory = (campaigns: { campaigns: { id: string, category: string }[] }) => {
  // Create a mapping from value to name using the categories constant
  const valueToName = categories.reduce((acc, cat) => {
    acc[cat.value] = cat.name;
    return acc;
  }, {} as Record<number, string>);


  // Group campaigns by category name
  const grouped = campaigns.campaigns.reduce<Record<string, number>>((acc, campaign) => {
    const categoryName = valueToName[Number(campaign.category)] || 'OTHER';
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {});

  // Transform into pie chart format
  return Object.entries(grouped)
    .map(([name, value]) => ({
      title: name.charAt(0) + name.slice(1).toLowerCase(), // Proper case
      value,
      color: categoryColors[name]
    }))
    .filter(item => item.value > 0); // Only include categories that have campaigns
};

export {
  isPdf, getCampaignCategories, truncateAddress, copyToClipboard,
  filterDonations, canWithdrawMilestone, trendingCampaigns, groupCampaignsByCategory
};