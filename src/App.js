// App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './home';
import StudentRegistration from './register';
import PhotoAdminPage from './Admin/Photo'
import DepartmentAdminPage from './Admin/department';
import AdminLogin from './Admin/admin_login';
import SuperAdminPage from './Admin/super_admin';
import NextStudentQueue from './queue';

function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentRegistration />} />
      <Route path="/home" element={<Home />} />
      <Route path='/admin/photo' element={<PhotoAdminPage />} />
      <Route path="/admin/department/:department" element={<DepartmentAdminPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/super" element={<SuperAdminPage />} />
      <Route path="/queue" element={<NextStudentQueue />} />
      {/* Add more routes as needed */}
    </Routes>
  );
}

export default App;
