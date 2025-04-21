"use client";
import FeeManagementComponent from "../components/admin/FeeManagementComponent";
import CategoryDistributionComponent from "../components/admin/CategoryDistributionCollectionComponent";
import CampaignListComponent from "../components/admin/CampaignListComponent";
import AdminAccessComponent from "../components/admin/AdminAccessComponent";
import TransferContractOwnership from '../components/admin/TransFerContractOwnershipComponent';

export default function AdminPage() {
    return (
      <AdminAccessComponent>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-4xl font-extrabold text-indigo-600 text-center">
              Admin Dashboard
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-lg p-6">
                <FeeManagementComponent />
              </div>
              <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-lg p-6">
                <TransferContractOwnership />
              </div>
              <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-lg p-6">
                <CategoryDistributionComponent />
              </div>
              <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-lg p-6">
                <CampaignListComponent />
              </div>
            </div>
          </div>
        </div>
      </AdminAccessComponent>
    );
  }