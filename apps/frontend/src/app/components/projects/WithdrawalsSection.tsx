export const WithdrawalsSection = ({ withdrawals }: { withdrawals: any[] }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <h2 className="text-2xl font-bold mb-6">Withdrawals</h2>
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {withdrawals.map((withdrawal) => (
        <div
          key={withdrawal.id}
          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-gray-500">
              {new Date(withdrawal.date).toLocaleDateString()}
            </p>
          </div>
          <p className="font-semibold">{withdrawal.amount} ETH</p>
        </div>
      ))}
    </div>
  </div>
); 