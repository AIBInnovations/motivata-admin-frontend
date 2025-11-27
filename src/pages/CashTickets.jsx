import { useState } from 'react'

function CashTickets() {
  const [ticketQuantity, setTicketQuantity] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')

  const statusColors = {
    registered: 'bg-blue-100 text-blue-700',
    redeemed: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
  }

  const [tickets] = useState([
    { id: 1, dateTime: '2025-01-15 10:30 AM', quantity: 2, status: 'redeemed', phone: '+91 9876543210' },
    { id: 2, dateTime: '2025-01-16 02:45 PM', quantity: 1, status: 'registered', phone: '+91 9876543211' },
    { id: 3, dateTime: '2025-01-17 11:00 AM', quantity: 3, status: 'expired', phone: '+91 9876543212' },
    { id: 4, dateTime: '2025-01-18 04:15 PM', quantity: 1, status: 'redeemed', phone: '+91 9876543213' },
    { id: 5, dateTime: '2025-01-19 09:30 AM', quantity: 2, status: 'registered', phone: '+91 9876543214' },
    { id: 6, dateTime: '2025-01-20 03:00 PM', quantity: 4, status: 'expired', phone: '+91 9876543215' },
    { id: 7, dateTime: '2025-01-21 01:45 PM', quantity: 1, status: 'redeemed', phone: '+91 9876543216' },
    { id: 8, dateTime: '2025-01-22 10:00 AM', quantity: 2, status: 'registered', phone: '+91 9876543217' },
  ])

  const handleGenerateLink = () => {
    if (!phoneNumber) {
      alert('Please enter phone number')
      return
    }
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2)
    const link = `https://tickets.aibinnovations.com/cash/${uniqueId}?qty=${ticketQuantity}&phone=${phoneNumber}`
    setGeneratedLink(link)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    alert('Link copied to clipboard!')
  }

  return (
    <div>
      {/* Generate Link Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Generate Cash Ticket Link</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ticket Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Ticket Quantity</label>
            <select
              value={ticketQuantity}
              onChange={(e) => setTicketQuantity(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Ticket' : 'Tickets'}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerateLink}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
            >
              Generate Link
            </button>
          </div>
        </div>

        {/* Generated Link Display */}
        {generatedLink && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">Generated Link:</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-4 py-2 bg-white border border-green-300 rounded-lg text-gray-700 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tickets List Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Generated Tickets</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Date & Time</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Ticket Quantity</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Mobile Number</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-600">{ticket.dateTime}</td>
                <td className="px-6 py-4 text-gray-600">{ticket.quantity} {ticket.quantity === 1 ? 'Ticket' : 'Tickets'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{ticket.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CashTickets
