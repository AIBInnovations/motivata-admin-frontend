import { useState } from 'react'
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, X, Upload } from 'lucide-react'

function Events() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    eventTitle: '',
    organizer: '',
    type: '',
    category: '',
    location: '',
    eventStarts: '',
    startTime: '',
    eventEnds: '',
    endTime: '',
    image: null,
    imagePreview: '',
  })
  const eventsPerPage = 10

  const categories = ['engineering', 'medical', 'comedy', 'music']
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow']

  const categoryColors = {
    engineering: 'bg-blue-100 text-blue-700',
    medical: 'bg-green-100 text-green-700',
    comedy: 'bg-yellow-100 text-yellow-700',
    music: 'bg-purple-100 text-purple-700',
  }

  const [events, setEvents] = useState([
    {
      id: 1,
      name: 'Tech Conference 2025',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=150&fit=crop',
      eventDate: '2025-03-15',
      bookingEndDate: '2025-03-10',
      category: 'engineering',
      city: 'Mumbai',
    },
    {
      id: 2,
      name: 'Music Festival',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=150&fit=crop',
      eventDate: '2025-04-20',
      bookingEndDate: '2025-04-15',
      category: 'music',
      city: 'Delhi',
    },
    {
      id: 3,
      name: 'Medical Summit',
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=200&h=150&fit=crop',
      eventDate: '2025-05-10',
      bookingEndDate: '2025-05-05',
      category: 'medical',
      city: 'Bangalore',
    },
    {
      id: 4,
      name: 'Stand-up Comedy Night',
      image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=200&h=150&fit=crop',
      eventDate: '2025-06-01',
      bookingEndDate: '2025-05-28',
      category: 'comedy',
      city: 'Pune',
    },
    {
      id: 5,
      name: 'AI & Machine Learning Workshop',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=150&fit=crop',
      eventDate: '2025-03-25',
      bookingEndDate: '2025-03-20',
      category: 'engineering',
      city: 'Hyderabad',
    },
    {
      id: 6,
      name: 'Rock Concert Live',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=150&fit=crop',
      eventDate: '2025-04-05',
      bookingEndDate: '2025-04-01',
      category: 'music',
      city: 'Chennai',
    },
    {
      id: 7,
      name: 'Healthcare Innovation Summit',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=150&fit=crop',
      eventDate: '2025-05-20',
      bookingEndDate: '2025-05-15',
      category: 'medical',
      city: 'Kolkata',
    },
    {
      id: 8,
      name: 'Comedy Circus Tour',
      image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=200&h=150&fit=crop',
      eventDate: '2025-06-15',
      bookingEndDate: '2025-06-10',
      category: 'comedy',
      city: 'Ahmedabad',
    },
    {
      id: 9,
      name: 'Robotics Expo 2025',
      image: 'https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?w=200&h=150&fit=crop',
      eventDate: '2025-07-10',
      bookingEndDate: '2025-07-05',
      category: 'engineering',
      city: 'Jaipur',
    },
    {
      id: 10,
      name: 'Classical Music Night',
      image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=200&h=150&fit=crop',
      eventDate: '2025-07-25',
      bookingEndDate: '2025-07-20',
      category: 'music',
      city: 'Lucknow',
    },
    {
      id: 11,
      name: 'Cardiology Conference',
      image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=200&h=150&fit=crop',
      eventDate: '2025-08-05',
      bookingEndDate: '2025-08-01',
      category: 'medical',
      city: 'Mumbai',
    },
    {
      id: 12,
      name: 'Laugh Riot Show',
      image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=200&h=150&fit=crop',
      eventDate: '2025-08-20',
      bookingEndDate: '2025-08-15',
      category: 'comedy',
      city: 'Delhi',
    },
  ])

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      eventTitle: event.name,
      organizer: '',
      type: '',
      category: event.category,
      location: event.city,
      eventStarts: event.eventDate,
      startTime: '',
      eventEnds: event.bookingEndDate,
      endTime: '',
      image: null,
      imagePreview: event.image,
    })
    setShowEditForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter((event) => event.id !== id))
    }
  }

  // Filter and sort events
  const filteredEvents = events
    .filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter ? event.category === categoryFilter : true
      const matchesCity = cityFilter ? event.city === cityFilter : true
      return matchesSearch && matchesCategory && matchesCity
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'date-asc') return new Date(a.eventDate) - new Date(b.eventDate)
      if (sortBy === 'date-desc') return new Date(b.eventDate) - new Date(a.eventDate)
      if (sortBy === 'city') return a.city.localeCompare(b.city)
      return 0
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)
  const startIndex = (currentPage - 1) * eventsPerPage
  const endIndex = startIndex + eventsPerPage
  const currentEvents = filteredEvents.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value)
    setCurrentPage(1)
  }

  const goToPage = (page) => {
    setCurrentPage(page)
  }

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  return (
    <div>
      {/* Search, Filters & Sort */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => handleFilterChange(setCityFilter, e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">Sort By</option>
            <option value="name">Name (A-Z)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="date-desc">Date (Newest First)</option>
            <option value="city">City (A-Z)</option>
          </select>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all ml-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Event</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Event Image */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Image</h3>
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex flex-col items-center justify-center">
                  {/* Image Preview */}
                  <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4">
                    {formData.imagePreview ? (
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Upload className="h-10 w-10 mx-auto mb-2" />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>
                  {/* Upload & Remove Buttons */}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                        <Upload className="h-4 w-4" />
                        <span>Upload Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setFormData({
                                ...formData,
                                image: file,
                                imagePreview: reader.result,
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                    {formData.imagePreview && (
                      <button
                        onClick={() => setFormData({ ...formData, image: null, imagePreview: '' })}
                        className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-3">PNG, JPG up to 5MB</p>
                </div>
              </div>

              {/* General Info */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={formData.eventTitle}
                    onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Organizer</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter organizer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="appearance">Appearance or Signing</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="concert">Concert</option>
                    <option value="exhibition">Exhibition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select location</option>
                    <option value="online">Online event</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date and Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Event Starts</label>
                  <input
                    type="date"
                    value={formData.eventStarts}
                    onChange={(e) => setFormData({ ...formData, eventStarts: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Event Ends</label>
                  <input
                    type="date"
                    value={formData.eventEnds}
                    onChange={(e) => setFormData({ ...formData, eventEnds: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Create event:', formData)
                    setShowCreateForm(false)
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Event</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Event Image */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Image</h3>
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex flex-col items-center justify-center">
                  {/* Image Preview */}
                  <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4">
                    {formData.imagePreview ? (
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Upload className="h-10 w-10 mx-auto mb-2" />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>
                  {/* Upload & Remove Buttons */}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                        <Upload className="h-4 w-4" />
                        <span>Upload Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setFormData({
                                ...formData,
                                image: file,
                                imagePreview: reader.result,
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                    {formData.imagePreview && (
                      <button
                        onClick={() => setFormData({ ...formData, image: null, imagePreview: '' })}
                        className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-3">PNG, JPG up to 5MB</p>
                </div>
              </div>

              {/* General Info */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={formData.eventTitle}
                    onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Organizer</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter organizer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="appearance">Appearance or Signing</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="concert">Concert</option>
                    <option value="exhibition">Exhibition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select location</option>
                    <option value="online">Online event</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date and Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Event Starts</label>
                  <input
                    type="date"
                    value={formData.eventStarts}
                    onChange={(e) => setFormData({ ...formData, eventStarts: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Event Ends</label>
                  <input
                    type="date"
                    value={formData.eventEnds}
                    onChange={(e) => setFormData({ ...formData, eventEnds: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditForm(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Update event:', editingEvent?.id, formData)
                    setShowEditForm(false)
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Update Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Event</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Category</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">City</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Event Date</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Booking End Date</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEvents.map((event) => (
              <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <span className="font-medium text-gray-900">{event.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${categoryColors[event.category]}`}>
                    {event.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{event.city}</td>
                <td className="px-6 py-4 text-gray-600">{event.eventDate}</td>
                <td className="px-6 py-4 text-gray-600">{event.bookingEndDate}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredEvents.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Events
