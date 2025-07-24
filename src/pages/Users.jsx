// src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  where,
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  Users as UsersIcon, 
  Search, 
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Crown,
  Shield,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';

const Users = () => {
  const { userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    if (userRole !== 'owner') return;

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = [];
      snapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'client':
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'admin':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'client':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      showToast('User role updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('Failed to update user role', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setShowDeleteModal(false);
      setDeletingUser(null);
      showToast('User deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesFilter;
  });

  const showToast = (message, type) => {
    console.log(`${type}: ${message}`);
  };

  if (userRole !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Only owners can access user management</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Sidebar />
      <div className="ml-64 flex flex-col">
        <Navbar />
        
        <main className="flex-1 p-8 pt-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <UsersIcon className="w-8 h-8 mr-3 text-blue-400" />
                User Management
              </h1>
              <p className="text-gray-400">
                Manage users, roles, and permissions
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 netflix-gradient hover:netflix-gradient-hover text-white rounded-lg transition-all duration-200">
                <Plus className="w-4 h-4" />
                <span>Invite User</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Users', value: users.length, color: 'blue', icon: <UsersIcon className="w-5 h-5" /> },
              { label: 'Owners', value: users.filter(u => u.role === 'owner').length, color: 'yellow', icon: <Crown className="w-5 h-5" /> },
              { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'blue', icon: <Shield className="w-5 h-5" /> },
              { label: 'Clients', value: users.filter(u => u.role === 'client').length, color: 'green', icon: <User className="w-5 h-5" /> }
            ].map((stat, index) => (
              <div key={index} className="glass-dark p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-${stat.color}-600/20 rounded-xl`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="glass-dark p-6 rounded-2xl border border-white/10 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                </select>
                
                <button className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">User</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Role</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Last Login</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-t border-white/10">
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-4 w-4 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="animate-pulse bg-gray-600 h-10 w-10 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="animate-pulse bg-gray-600 h-4 w-32 rounded"></div>
                              <div className="animate-pulse bg-gray-600 h-3 w-24 rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-6 w-20 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-4 w-24 rounded"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="animate-pulse bg-gray-600 h-8 w-8 rounded"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No users found</p>
                        <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition-all">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.displayName || 'No Name'}</p>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className={`px-3 py-1 rounded-lg border text-sm font-medium ${getRoleBadgeColor(user.role)} bg-transparent`}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="client">Client</option>
                          </select>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              user.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm ${
                              user.isActive ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <span className="text-gray-400 text-sm">
                            {user.lastLogin ? 
                              new Date(user.lastLogin).toLocaleDateString() : 
                              'Never'
                            }
                          </span>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => {
                                setDeletingUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 glass-dark p-4 rounded-2xl border border-white/10 flex items-center space-x-4">
              <span className="text-white text-sm">
                {selectedUsers.length} user(s) selected
              </span>
              
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all">
                  Change Role
                </button>
                
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all">
                  Delete Selected
                </button>
                
                <button
                  onClick={() => setSelectedUsers([])}
                  className="p-2 text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-dark p-6 rounded-2xl border border-red-500/20 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">Delete User</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <strong>{deletingUser.displayName}</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => handleDeleteUser(deletingUser.id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;