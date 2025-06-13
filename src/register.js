import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';

// Configuration for your Flask backend
const API_BASE_URL = 'https://backend-jain.vercel.app';

export default function StudentRegistration() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errors, setErrors] = useState({});
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

  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [parentPhoneCountry, setParentPhoneCountry] = useState('+91');

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

  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+971', country: 'UAE' },
    { code: '+65', country: 'Singapore' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' }
  ];

  // Enhanced localStorage handler with error recovery
  const getStoredData = () => {
    try {
      if (typeof Storage === 'undefined') {
        console.warn('localStorage not supported');
        return null;
      }
      const data = localStorage.getItem('studentRegistration');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('localStorage read error:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('studentRegistration');
      } catch (clearError) {
        console.error('localStorage clear error:', clearError);
      }
      return null;
    }
  };

  const setStoredData = (data) => {
    try {
      if (typeof Storage !== 'undefined') {
        localStorage.setItem('studentRegistration', JSON.stringify(data));
        return true;
      }
    } catch (error) {
      console.error('localStorage write error:', error);
      setMessage('Warning: Unable to save data locally. Please bookmark this page.');
    }
    return false;
  };

  // Check localStorage on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const savedStudentData = getStoredData();
    if (savedStudentData) {
      console.log('Found saved registration data');
      setStudentData(savedStudentData);
      setMessage('Welcome back! Your registration details are shown below.');
    }
  }, []);

  // Memoized change handlers to prevent re-renders
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const handlePhoneCountryChange = useCallback((newCountry) => {
    setPhoneCountry(newCountry);
  }, []);

  const handleParentPhoneCountryChange = useCallback((newCountry) => {
    setParentPhoneCountry(newCountry);
  }, []);

  // Enhanced validation with specific error messages
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name contains invalid characters';
    }

    // Phone validation with better regex
    const phoneRegex = /^\d{10,15}$/;
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Phone number must be 10-15 digits';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Department validation
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    // Date of birth validation
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      if (dob > today) {
        newErrors.dob = 'Date of birth cannot be in the future';
      } else if (age < 16 || age > 100) {
        newErrors.dob = 'Please enter a valid date of birth (age 16-100)';
      }
    }

    // Parent name validation
    if (!formData.parentName?.trim()) {
      newErrors.parentName = 'Parent name is required';
    } else if (formData.parentName.trim().length < 2) {
      newErrors.parentName = 'Parent name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.parentName.trim())) {
      newErrors.parentName = 'Parent name contains invalid characters';
    }

    // Parent email validation
    if (!formData.parentEmail?.trim()) {
      newErrors.parentEmail = 'Parent email is required';
    } else if (!emailRegex.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid parent email address';
    }

    // Parent phone validation
    if (!formData.parentPhone?.trim()) {
      newErrors.parentPhone = 'Parent phone number is required';
    } else if (!phoneRegex.test(formData.parentPhone.replace(/\s+/g, ''))) {
      newErrors.parentPhone = 'Parent phone number must be 10-15 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegistration = async () => {
    if (loading) return;

    console.log('🚀 Starting registration process');

    if (!validateForm()) {
      setMessage('Please fix the errors below and try again.');
      return;
    }

    setLoading(true);
    setMessage('Processing registration...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/api/students/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Email or phone number already registered');
        } else if (response.status === 400) {
          throw new Error('Invalid registration data. Please check your inputs.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Registration failed (${response.status})`);
        }
      }

      const data = await response.json();

      if (data.success) {
        const registrationData = {
          name: data.data.name,
          studentId: data.studentId,
          department: data.data.department,
          status: 'pending',
          hasPhoto: false,
          applicationNumber: null,
          registrationDate: new Date().toISOString()
        };

        setStoredData(registrationData);
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
        setErrors({});

      } else {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'AbortError') {
        setMessage('Request timed out. Please check your connection and try again.');
      } else if (error.message.includes('fetch')) {
        setMessage('Unable to connect to server. Please check your internet connection.');
      } else {
        setMessage(`Error: ${error.message}`);
      }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE_URL}/api/students/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: studentData.studentId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status check failed (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        const updatedData = {
          name: data.student.name,
          studentId: data.student.studentId,
          department: data.student.department,
          status: data.student.status,
          hasPhoto: data.student.hasPhoto,
          applicationNumber: data.student.applicationNumber,
          registrationDate: data.student.registrationDate
        };

        setStoredData(updatedData);
        setStudentData(updatedData);
        setMessage('Status updated! 🎉');
      } else {
        throw new Error(data.error || 'No updates found');
      }
    } catch (error) {
      console.error('Status check error:', error);
      
      if (error.name === 'AbortError') {
        setMessage('Status check timed out. Please try again.');
      } else {
        setMessage('Error: Unable to check status. Please try again later.');
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleClearRegistration = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearRegistration = () => {
    try {
      localStorage.removeItem('studentRegistration');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
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

  // Enhanced Phone Input Component - Fixed for mobile
  const PhoneInput = React.memo(({
    value,
    onChange,
    countryCode,
    onCountryChange,
    placeholder,
    id,
    name,
    error
  }) => {
    // Use useCallback to prevent function recreation
    const handleInputChange = React.useCallback((e) => {
      onChange(e);
    }, [onChange]);

    const handleCountryChange = React.useCallback((e) => {
      onCountryChange(e.target.value);
    }, [onCountryChange]);

    return (
      <div>
        <div className="flex">
          <select
            value={countryCode}
            onChange={handleCountryChange}
            className={`min-w-0 w-20 px-2 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} border-r-0 rounded-l bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {countryCodes.map(({ code, country }) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <input
            type="tel"
            id={id}
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel"
            required
            className={`min-w-0 flex-1 px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} border-l-0 rounded-r focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  });

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
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
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
                  : message.includes('Warning')
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
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

              <button
                onClick={handleClearRegistration}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Clear Data
              </button>
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
              onError={(e) => {
                e.target.style.display = 'none';
              }}
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
                : message.includes('Warning')
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
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
                    className={`w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
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
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className={`w-full px-3 py-2 border ${errors.dob ? 'border-red-300' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`}
                  />
                  {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={handleChange}
                    countryCode={phoneCountry}
                    onCountryChange={handlePhoneCountryChange}
                    placeholder="Enter phone number"
                    id="phone"
                    name="phone"
                    error={errors.phone}
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
                    inputMode="email"
                    required
                    className={`w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
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
                    className={`w-full px-3 py-2 border ${errors.department ? 'border-red-300' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
                </div>
              </div>
            </div>

            {/* Parent Information Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Parent Information
              </h3>

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
                    className={`w-full px-3 py-2 border ${errors.parentName ? 'border-red-300' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`}
                  />
                  {errors.parentName && <p className="mt-1 text-xs text-red-600">{errors.parentName}</p>}
                </div>

                <div>
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Phone *
                  </label>
                  <PhoneInput
                    value={formData.parentPhone}
                    onChange={handleChange}
                    countryCode={parentPhoneCountry}
                    onCountryChange={handleParentPhoneCountryChange}
                    placeholder="Parent's phone number"
                    id="parentPhone"
                    name="parentPhone"
                    error={errors.parentPhone}
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
                    inputMode="email"
                    required
                    className={`w-full px-3 py-2 border ${errors.parentEmail ? 'border-red-300' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm`}
                  />
                  {errors.parentEmail && <p className="mt-1 text-xs text-red-600">{errors.parentEmail}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleRegistration}
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white py-3 px-6 rounded font-medium text-sm transition-colors"
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