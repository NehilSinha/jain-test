import React, { useState, useEffect } from 'react';
import { Users, Clock, Phone, Mail, Calendar } from 'lucide-react';

const StudentQueueDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Configuration
  const API_BASE_URL = 'https://backend-jain.vercel.app';

  // Fetch students from Flask backend
const fetchStudents = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched students:', data);

    // ✅ Adjusted: Check for `students` key in the response
    if (!Array.isArray(data.students)) {
      throw new Error('Invalid data format: expected "students" array');
    }

    const validStudents = data.students.filter(student =>
      student &&
      typeof student === 'object' &&
      student.studentId &&
      student.name &&
      student.department
    );

    if (validStudents.length !== data.students.length) {
      console.warn(`Filtered out ${data.students.length - validStudents.length} invalid student records`);
    }

    setStudents(validStudents);
    console.log(`Successfully loaded ${validStudents.length} students from backend`);

    // Optional: You can also store pagination if you want
    // setPagination(data.pagination);

  } catch (err) {
    console.error('Backend error:', err.message);

    if (err.name === 'TimeoutError') {
      setError('Backend connection timeout');
    } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      setError('Cannot connect to backend server');
    } else {
      setError(`Backend error: ${err.message}`);
    }

    setStudents([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(fetchStudents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    fetchStudents();
  };

  // Group students by department and sort by registration date
  const groupedStudents = students.reduce((acc, student) => {
    const dept = student.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(student);
    return acc;
  }, {});

  // Sort students within each department by registration date (queue order)
  Object.keys(groupedStudents).forEach(dept => {
    groupedStudents[dept].sort((a, b) => 
      new Date(a.registrationDate) - new Date(b.registrationDate)
    );
  });

  const departments = Object.keys(groupedStudents);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // if (loading) {
  //   console.log("Loading Queue")
  //   return (
  //     <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
  //         <p className="text-gray-600 text-sm">Loading student queue...</p>
  //       </div>
  //     </div>
      
  //   );
  // }

  // Don't show error screen if we have students
  if (error && students.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2 text-sm">Cannot Connect to Backend</h3>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <p className="text-xs text-gray-600 mb-4">
            Make sure your Flask backend is running at: <code className="bg-gray-100 px-1 rounded text-xs">{API_BASE_URL}</code>
          </p>
          <button 
            onClick={fetchStudents}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {/* College Logo - placeholder for now */}
            <img
              src="./favicon.ico"
              alt="Jain University Logo"
              className="w-20 h-20 object-contain mr-6"
            />
            <div className="text-left">
              <h1 className="text-base font-medium text-blue-900 leading-tight">
                JAIN (Deemed-to-be-University)<br />
                Faculty of Engineering and Technology (FET)
              </h1>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Student Queue Dashboard</h2>
          <p className="text-gray-600 text-sm">Next students in queue by department</p>
        </div>

        {/* Status Bar */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {error && (
                <>
                  <div className="bg-red-50 border border-red-200 text-red-800 px-2 py-1 rounded text-xs">
                    Connection Error
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs"
                  >
                    Retry
                  </button>
                </>
              )}
              {!error && students.length > 0 && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-2 py-1 rounded text-xs">
                  Backend Connected
                </div>
              )}
              <button
                onClick={handleRefresh}
                className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No Students in Queue</h3>
            <p className="text-gray-600 text-sm">There are currently no students waiting in any department.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {departments.map((department) => {
              const deptStudents = groupedStudents[department];
              const nextStudent = deptStudents[0]; // First in queue
              const queueLength = deptStudents.length;

              return (
                <div key={department} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  {/* Department Header */}
                  <div className="bg-blue-900 text-white p-4">
                    <h3 className="text-base font-semibold">{department}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{queueLength} in queue</span>
                    </div>
                  </div>

                  {/* Next Student Card */}
                  <div className="p-4">
                    {nextStudent && nextStudent.status !== 'verified' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-green-50 border border-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Next in Queue
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            nextStudent.status === 'active' 
                              ? 'bg-green-50 border border-green-200 text-green-800' 
                              : nextStudent.status === 'pending'
                              ? 'bg-amber-50 border border-amber-200 text-amber-800'
                              : nextStudent.status === 'photo_uploaded'
                              ? 'bg-blue-50 border border-blue-200 text-blue-800'
                              : 'bg-gray-50 border border-gray-200 text-gray-800'
                          }`}>
                            {nextStudent.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {nextStudent.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              ID: {nextStudent.studentId}
                            </p>
                            {nextStudent.applicationNumber && (
                              <p className="text-xs text-gray-600">
                                App #: {nextStudent.applicationNumber}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            {nextStudent.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{nextStudent.email}</span>
                              </div>
                            )}
                            {nextStudent.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span>{nextStudent.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>Registered: {formatDate(nextStudent.registrationDate)}</span>
                            </div>
                            <div className="text-xs text-gray-600 ml-5">
                              <span>Time: {formatTime(nextStudent.registrationDate)}</span>
                            </div>
                          </div>

                          {nextStudent.parentName && (
                            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                              <p className="text-xs font-medium text-gray-700">Parent/Guardian</p>
                              <p className="text-xs text-gray-600">{nextStudent.parentName}</p>
                              {nextStudent.parentPhone && (
                                <p className="text-xs text-gray-600">{nextStudent.parentPhone}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {queueLength > 1 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600">
                              {queueLength - 1} more student{queueLength > 2 ? 's' : ''} waiting
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">No students in queue</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="text-center">
            <p className="text-blue-900 font-medium text-sm mb-1">Real-time Queue Management</p>
            <p className="text-blue-800 text-xs">
              This dashboard automatically refreshes every 5 seconds to show the most current queue status. 
              Students are displayed in order of registration time within each department.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQueueDashboard;