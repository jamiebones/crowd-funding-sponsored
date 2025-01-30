
"use client";
import Donation from "./Donations";
import DonationWithdrawn from "./DonationWithdrawn";



interface Donor {
    id: string;
    address: string;
    donations: Donation[];
    withdrawals: DonationWithdrawn[];
    totalDonated: string;
    totalWithdrawn: string;
}
   

export default Donor

