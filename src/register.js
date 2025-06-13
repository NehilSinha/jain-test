import { useState, useEffect, useRef } from 'react';

// Configuration for your Flask backend
const API_BASE_URL = 'https://backend-jain.vercel.app';

export default function StudentRegistration() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const hasInitialized = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    dob: ''
  });

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Chemical',
    'Electrical',
    'Information Technology',
    'Biotechnology'
  ];

  // Check localStorage on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const savedStudentData = JSON.parse(localStorage.getItem('studentRegistration') || 'null');

      if (savedStudentData) {
        console.log('Found saved registration data');
        setStudentData(savedStudentData);
        setMessage('Welcome back! Your registration details are shown below.');
      }
    } catch (error) {
      console.error('localStorage error:', error);
      localStorage.removeItem('studentRegistration');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      { key: 'name', label: 'Full Name' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'email', label: 'Email Address' },
      { key: 'department', label: 'Department' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'parentName', label: 'Parent Name' },
      { key: 'parentEmail', label: 'Parent Email' },
      { key: 'parentPhone', label: 'Parent Phone' }
    ];

    for (let field of requiredFields) {
      if (!formData[field.key] || formData[field.key].trim() === '') {
        return `Please fill in: ${field.label}`;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (!emailRegex.test(formData.parentEmail)) {
      return 'Please enter a valid parent email address';
    }

    if (formData.phone.length < 10) {
      return 'Please enter a valid phone number (at least 10 digits)';
    }
    if (formData.parentPhone.length < 10) {
      return 'Please enter a valid parent phone number (at least 10 digits)';
    }

    return null;
  };

  const handleRegistration = async () => {
    if (loading) return;

    console.log('🚀 Starting registration process');

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage('Processing registration...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const registrationData = {
          name: data.data.name,
          studentId: data.studentId,
          department: data.data.department,
          status: 'pending',
          hasPhoto: false,
          applicationNumber: null,
          registrationDate: new Date().toISOString()
        };

        localStorage.setItem('studentRegistration', JSON.stringify(registrationData));
        setStudentData(registrationData);
        setMessage('Registration successful! 🎉');

        // Clear form
        setFormData({
          name: '',
          phone: '',
          email: '',
          department: '',
          parentName: '',
          parentEmail: '',
          parentPhone: '',
          dob: ''
        });

      } else {
        setMessage(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Error: Unable to connect to server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const checkStudentStatus = async () => {
    if (!studentData?.studentId || checkingStatus) return;

    console.log('🔄 Checking student status');

    setCheckingStatus(true);
    setMessage('Checking for updates...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: studentData.studentId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedData = {
          name: data.student.name,
          studentId: data.student.studentId,
          department: data.student.department,
          status: data.student.status,
          hasPhoto: data.student.hasPhoto,
          applicationNumber: data.student.applicationNumber,
          registrationDate: data.student.registrationDate
        };

        localStorage.setItem('studentRegistration', JSON.stringify(updatedData));
        setStudentData(updatedData);
        setMessage('Status updated! 🎉');
      } else {
        setMessage(data.error || 'No updates found');
      }
    } catch (error) {
      console.error('Status check error:', error);
      setMessage('Error: Unable to connect to server.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleClearRegistration = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearRegistration = () => {
    localStorage.removeItem('studentRegistration');
    setStudentData(null);
    setMessage('Registration data cleared');
    setShowConfirmDialog(false);
  };

  const cancelClearRegistration = () => {
    setShowConfirmDialog(false);
  };

  const getStatusMessage = () => {
    if (!studentData) return '';

    switch (studentData.status) {
      case 'pending':
        return 'Next step: Visit the photo room with your Student ID';
      case 'photo_taken':
        return 'Next step: Visit your department admin for document verification';
      case 'documents_verified':
        return 'Registration complete! ✅ All steps finished.';
      default:
        return 'Contact administration for status update';
    }
  };

  const getDisplayId = () => {
    if (!studentData) return { label: '', value: '' };

    if (studentData.applicationNumber) {
      return {
        label: 'Application Number',
        value: studentData.applicationNumber
      };
    } else {
      return {
        label: 'Student ID',
        value: studentData.studentId
      };
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'photo_taken': return 'bg-blue-900';
      case 'documents_verified': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  // Confirmation Dialog Component
  const ConfirmDialog = () => {
    if (!showConfirmDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Clear Registration Data?
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            This will permanently delete your registration data. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={cancelClearRegistration}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={confirmClearRegistration}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show student dashboard if registered
  if (studentData) {
    const displayId = getDisplayId();

    return (
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="./favicon.ico"
                alt="Jain University Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-base font-medium text-blue-900 leading-tight">
              JAIN (Deemed-to-be-University)<br />
              Faculty of Engineering and Technology (FET)
            </h1>
          </div>

          {/* Main Content Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Status</h2>
              <p className="text-gray-600 text-sm">Welcome, {studentData.name}</p>
            </div>

            {message && (
              <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
                message.includes('successful') || message.includes('Welcome') || message.includes('updated')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message}
              </div>
            )}

            {/* ID Display */}
            <div className="bg-blue-900 text-white p-4 rounded-lg mb-6 text-center">
              <p className="text-xs opacity-90 mb-1">Your {displayId.label}</p>
              <div className="text-lg font-mono font-semibold tracking-wider">
                {displayId.value}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-200 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <p className="font-medium text-gray-900 text-sm">{studentData.department}</p>
              </div>
              <div className="border border-gray-200 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${getStatusBadgeColor(studentData.status)}`}>
                  {studentData.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="border border-gray-200 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Registered</p>
                <p className="font-medium text-gray-900 text-sm">{new Date(studentData.registrationDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Next Step */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-center">
              <p className="text-blue-900 font-medium text-sm">{getStatusMessage()}</p>
            </div>

            {/* Original Student ID (if applicable) */}
            {studentData.applicationNumber && (
              <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg text-center">
                Original Student ID: {studentData.studentId}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <button
                onClick={checkStudentStatus}
                disabled={checkingStatus}
                className="bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
              >
                {checkingStatus ? 'Checking...' : 'Check for Updates'}
              </button>

              {/* <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Home
              </button> */}

              {/* <button
                onClick={handleClearRegistration}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Clear Data
              </button> */}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900 text-center">
              <p className="font-medium mb-1">Important</p>
              <p>Bookmark this page. Your data is saved locally. Check for updates after completing each step.</p>
            </div>
          </div>
        </div>

        <ConfirmDialog />
      </div>
    );
  }

  // Show registration form
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="./favicon.ico"
                alt="Jain University Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          <h1 className="text-base font-medium text-blue-900 leading-tight">
            JAIN (Deemed-to-be-University)<br />
            Faculty of Engineering and Technology (FET)
          </h1>
        </div>

        {/* Main Form Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Registration</h2>
            <p className="text-gray-600 text-sm">Please fill in all details for your college registration</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
              message.includes('successful')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Personal Information
              </h3>

              {/* All fields stacked vertically for mobile */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Parent Information Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Parent Information
              </h3>

              {/* All fields stacked vertically for mobile */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Name *
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="Parent's full name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Phone *
                  </label>
                  <input
                    type="tel"
                    id="parentPhone"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="Parent's phone number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Email *
                  </label>
                  <input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    placeholder="parent.email@example.com"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleRegistration}
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white py-3 px-6 rounded font-medium text-sm"
              >
                {loading ? 'Processing Registration...' : 'Complete Registration'}
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-6 bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900 text-center">
            <p className="font-medium mb-1">Mobile Friendly</p>
            <p>This form works on all devices. Your progress will be saved automatically after registration.</p>
          </div>
        </div>
      </div>

      <ConfirmDialog />
    </div>
  );
}