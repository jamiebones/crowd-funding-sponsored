import { copyToClipboard, truncateAddress } from "@/lib/utility";
import { FaCopy } from "react-icons/fa";

export const WithdrawalsSection = ({ withdrawals }: { withdrawals: any[] }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <h2 className="text-2xl font-bold mb-6">Withdrawals</h2>
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {withdrawals.map((withdrawal) => (
        <div
          key={withdrawal.id}
          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 flex items-center gap-4"
        >
          <p className="text-sm text-gray-500">
            {new Date(withdrawal.timestamp * 1000).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              {truncateAddress(withdrawal.donor.id)}
            </p>
            <button
              onClick={() => copyToClipboard(withdrawal.donor.id)}
              className="text-gray-500 hover:text-purple-600 transition-colors"
            >
              <FaCopy size={14} />
            </button>
          </div>
          <p className="font-semibold ml-auto">{(+withdrawal.amount.toString()) / 10 ** 18} BNB</p>
        </div>
      ))}
    </div>
  </div>
); 