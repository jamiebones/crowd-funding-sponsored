

"use client";
import Donor from "./Donor";
import Campaign from "./Campaign";



interface Donation {
    id: string;
    donor: Donor;
    donatingTo: Campaign;
    amount: string;
    timestamp: string;
}
   

export default Donation

