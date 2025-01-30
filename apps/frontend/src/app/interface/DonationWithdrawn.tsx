
"use client";
import Donor from "./Donor";
import Campaign from "./Campaign";


interface DonationWithdrawn {
    id: string;
    donor: Donor;
    withdrawingFrom: Campaign;
    amount: string;
    timestamp: string;
}
   

export default DonationWithdrawn

