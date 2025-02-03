import { categories } from "@/app/constant/categories";
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
  debugger;
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

const canWithdrawMilestone = (projectDuration: number) => {
  return new Date() > new Date(projectDuration * 1000);
};

  export { isPdf, getCampaignCategories, truncateAddress, copyToClipboard, 
    filterDonations, canWithdrawMilestone };