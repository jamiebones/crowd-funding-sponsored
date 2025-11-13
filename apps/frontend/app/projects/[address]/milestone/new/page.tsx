'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { GET_CAMPAIGN_MANAGE_DATA } from '@/lib/queries/campaign-manage';
import { Campaign } from '@/types/campaign';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { addressToSubgraphId } from '@/lib/utils';
import {
  ArrowLeft,
  Loader2,
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import CROWD_FUNDING_CONTRACT from '@/abis/CrowdFunding.json';

const CROWD_FUNDING_ABI = CROWD_FUNDING_CONTRACT.abi;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_MILESTONES = 3;

export default function CreateMilestonePage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const { address: walletAddress, isConnected } = useAccount();

  // Convert address to subgraph ID format
  const campaignId = address.startsWith('0x') && address.length === 42
    ? addressToSubgraphId(address.toLowerCase())
    : address.toLowerCase();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [milestoneCID, setMilestoneCID] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch campaign data
  const { data, loading: campaignLoading } = useQuery(GET_CAMPAIGN_MANAGE_DATA, {
    variables: { id: campaignId },
    skip: !address,
  });

  const campaign: Campaign | undefined = (data as any)?.campaign;

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if user is owner
  const isOwner = campaign?.owner?.id?.toLowerCase() === walletAddress?.toLowerCase();

  // Redirect if not connected or not owner
  useEffect(() => {
    if (!isConnected) {
      router.push(`/projects/${address}`);
    } else if (campaign && !isOwner) {
      router.push(`/projects/${address}/manage`);
    }
  }, [isConnected, campaign, isOwner, router, address]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && milestoneCID) {
      setShowSuccess(true);
      
      // Send email notifications to subscribers
      sendEmailNotifications();
    }
  }, [isSuccess, milestoneCID]);

  const sendEmailNotifications = async () => {
    try {
      const response = await fetch('/api/send-campaign-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign?.contractAddress || address,
          campaignTitle: campaign?.content?.title || campaign?.title || 'Campaign',
          updateType: 'milestone_created',
          milestoneTitle: title,
          milestoneDescription: description,
        }),
      });
    } catch (error) {
      console.error('Failed to send email notifications:', error);
      // Don't block the user flow if email fails
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const totalSize = [...files, ...selectedFiles].reduce((acc, file) => acc + file.size, 0);

    if (totalSize > MAX_FILE_SIZE) {
      setUploadError(`Total file size exceeds 10MB limit. Current: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setFiles([...files, ...selectedFiles]);
    setUploadError('');
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setUploadError('');
  };

  const handleUploadAndCreate = async () => {
    // Validation
    if (!title.trim()) {
      setUploadError('Title is required');
      return;
    }

    if (title.length > 100) {
      setUploadError('Title must be 100 characters or less');
      return;
    }

    if (!description.trim()) {
      setUploadError('Description is required');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Upload to Arweave via Turbo
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload-milestone', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Store the CID for the transaction
      setMilestoneCID(result.milestoneCID);

      // Create milestone on blockchain
      writeContract({
        address: (campaign?.contractAddress || address) as `0x${string}`,
        abi: CROWD_FUNDING_ABI,
        functionName: 'createNewMilestone',
        args: [result.milestoneCID],
      });

    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload milestone');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isConnected || (campaign && !isOwner)) {
    return null;
  }

  if (campaignLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Campaign not found
          </h1>
          <Link
            href="/projects"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Browse campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Validation checks
  const milestoneCount = campaign.milestone?.length || 0;
  const canCreateMilestone = campaign.campaignRunning && 
                             milestoneCount < MAX_MILESTONES && 
                             parseFloat(campaign.amountRaised) > 0;

  // Success modal
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Milestone Created! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Your milestone has been successfully created and is now open for voting.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <AlertCircle className="w-4 h-4" />
                <span>Voting period: 14 days from now</span>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                📧 Email notifications have been sent to all campaign subscribers
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href={`/projects/${address}/manage`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Back to Management
              </Link>
              <Link
                href={`/projects/${address}`}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                View Campaign
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validation error messages
  if (!canCreateMilestone) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/projects/${address}/manage`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Management
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Cannot Create Milestone
              </h1>
              
              <div className="text-left bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-3">
                {!campaign.campaignRunning && (
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">
                      Campaign is not active
                    </p>
                  </div>
                )}
                {milestoneCount >= MAX_MILESTONES && (
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">
                      Maximum of {MAX_MILESTONES} milestones reached ({milestoneCount}/{MAX_MILESTONES})
                    </p>
                  </div>
                )}
                {parseFloat(campaign.amountRaised) === 0 && (
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">
                      Campaign must have received donations before creating milestones
                    </p>
                  </div>
                )}
              </div>

              <Link
                href={`/projects/${address}/manage`}
                className="mt-6 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Back to Management
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={`/projects/${address}/manage`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Management
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Milestone
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Submit proof of progress for community voting ({milestoneCount}/{MAX_MILESTONES} milestones)
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* Title */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Milestone Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Prototype Development Completed"
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you've accomplished and how it meets this milestone..."
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proof of Completion (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="files"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="files" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Click to upload files
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Images, PDFs, or documents (Max 10MB total)
                </p>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {(totalSize / 1024 / 1024).toFixed(2)} MB / 10 MB
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-600 dark:text-red-400">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your milestone will be uploaded to Arweave (permanent storage)</li>
                  <li>Donors will have 14 days to vote on approval</li>
                  <li>Requires 2/3 majority vote to be approved</li>
                  <li>Email notifications will be sent to all subscribers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleUploadAndCreate}
            disabled={isUploading || isPending || isConfirming || !title.trim() || !description.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-colors shadow-lg shadow-blue-600/30"
          >
            {isUploading || isPending || isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUploading
                  ? 'Uploading to Arweave...'
                  : isPending
                  ? 'Confirm in Wallet...'
                  : 'Creating Milestone...'}
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Create Milestone
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            By creating a milestone, you agree that the information provided is accurate
          </p>
        </div>
      </div>
    </div>
  );
}
