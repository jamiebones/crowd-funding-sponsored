"use client";
import FeeManagementComponent from "../components/admin/FeeManagementComponent";
import CategoryDistributionComponent from "../components/admin/CategoryDistributionCollectionComponent";
import CampaignListComponent from "../components/admin/CampaignListComponent";
import AdminAccessComponent from "../components/admin/AdminAccessComponent";
import TransferContractOwnership from '../components/admin/TransFerContractOwnershipComponent';

export default function AdminPage() {
    return (
      <AdminAccessComponent>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
          <FeeManagementComponent />
          <TransferContractOwnership />
          <CategoryDistributionComponent />
          <CampaignListComponent />
        </div>
      </div>
      </AdminAccessComponent>
    );
  }