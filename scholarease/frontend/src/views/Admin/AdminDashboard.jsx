import React, { useState, useEffect } from 'react';
import {
  Shield,
  BookOpen,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ExternalLink,
  BarChart3,
  Layers,
  Save,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const INDIAN_STATES = [
  'All India',
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Delhi',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
];

const CATEGORIES = ['All', 'General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('scholarships'); // 'scholarships', 'users', 'metrics'

  // Data states
  const [scholarships, setScholarships] = useState([]);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [schSearch, setSchSearch] = useState('');
  const [schStatusFilter, setSchStatusFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // Modals
  const [isSchModalOpen, setIsSchModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);

  // Form State for Scholarship CRUD
  const [schForm, setSchForm] = useState({
    name: '',
    provider: '',
    description: '',
    benefits: '',
    deadline: '',
    applicationLink: '',
    status: 'Active',
    courseText: 'All',
    categorySelected: ['All'],
    state: 'All India',
    minimumIncome: 800000,
    minimumMarks: 60,
    otherRequirements: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schRes, usersRes, metricsRes] = await Promise.all([
        api.get('/scholarships'),
        api.get('/admins/users'),
        api.get('/admins/metrics'),
      ]);

      if (schRes.data.success) setScholarships(schRes.data.scholarships || []);
      if (usersRes.data.success) setUsers(usersRes.data.users || []);
      if (metricsRes.data.success) setMetrics(metricsRes.data.metrics || null);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingScholarship(null);
    setSchForm({
      name: '',
      provider: '',
      description: '',
      benefits: '',
      deadline: '',
      applicationLink: '',
      status: 'Active',
      courseText: 'All',
      categorySelected: ['All'],
      state: 'All India',
      minimumIncome: 800000,
      minimumMarks: 60,
      otherRequirements: '',
    });
    setIsSchModalOpen(true);
  };

  const openEditModal = (sch) => {
    setEditingScholarship(sch);
    setSchForm({
      name: sch.name,
      provider: sch.provider,
      description: sch.description,
      benefits: sch.benefits,
      deadline: sch.deadline ? sch.deadline.split('T')[0] : '',
      applicationLink: sch.applicationLink,
      status: sch.status,
      courseText: sch.criteria?.course?.join(', ') || 'All',
      categorySelected: sch.criteria?.category || ['All'],
      state: sch.criteria?.state || 'All India',
      minimumIncome: sch.criteria?.minimumIncome || 800000,
      minimumMarks: sch.criteria?.minimumMarks || 60,
      otherRequirements: sch.criteria?.otherRequirements || '',
    });
    setIsSchModalOpen(true);
  };

  const handleSchFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const coursesArray = schForm.courseText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: schForm.name,
        provider: schForm.provider,
        description: schForm.description,
        benefits: schForm.benefits,
        deadline: new Date(schForm.deadline),
        applicationLink: schForm.applicationLink,
        status: schForm.status,
        criteria: {
          course: coursesArray.length ? coursesArray : ['All'],
          category: schForm.categorySelected.length ? schForm.categorySelected : ['All'],
          state: schForm.state,
          minimumIncome: Number(schForm.minimumIncome),
          minimumMarks: Number(schForm.minimumMarks),
          otherRequirements: schForm.otherRequirements,
        },
      };

      if (editingScholarship) {
        const res = await api.put(`/admins/scholarships/${editingScholarship._id}`, payload);
        if (res.data.success) {
          setScholarships((prev) =>
            prev.map((s) => (s._id === editingScholarship._id ? res.data.scholarship : s))
          );
        }
      } else {
        const res = await api.post('/admins/scholarships', payload);
        if (res.data.success) {
          setScholarships((prev) => [res.data.scholarship, ...prev]);
        }
      }

      setIsSchModalOpen(false);
      // Refresh metrics
      const mRes = await api.get('/admins/metrics');
      if (mRes.data.success) setMetrics(mRes.data.metrics);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDeleteScholarship = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this scholarship?')) return;
    try {
      const res = await api.delete(`/admins/scholarships/${id}`);
      if (res.data.success) {
        setScholarships((prev) => prev.filter((s) => s._id !== id));
        const mRes = await api.get('/admins/metrics');
        if (mRes.data.success) setMetrics(mRes.data.metrics);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this user and all associated documents?')) return;
    try {
      const res = await api.delete(`/admins/users/${id}`);
      if (res.data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        const mRes = await api.get('/admins/metrics');
        if (mRes.data.success) setMetrics(mRes.data.metrics);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleCategoryToggle = (cat) => {
    if (cat === 'All') {
      setSchForm((prev) => ({ ...prev, categorySelected: ['All'] }));
      return;
    }

    setSchForm((prev) => {
      let current = prev.categorySelected.filter((c) => c !== 'All');
      if (current.includes(cat)) {
        current = current.filter((c) => c !== cat);
        if (current.length === 0) current = ['All'];
      } else {
        current.push(cat);
      }
      return { ...prev, categorySelected: current };
    });
  };

  // Filtered scholarships
  const filteredScholarships = scholarships.filter((s) => {
    if (schStatusFilter !== 'All' && s.status !== schStatusFilter) return false;
    if (schSearch.trim()) {
      const q = schSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.scholarshipId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
            Administrative Panel
          </span>
          <h1 className="page-title">ScholarEase Management Console</h1>
          <p className="page-subtitle">
            Admin: {user?.name} ({user?.email})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add New Scholarship
          </button>
        </div>
      </div>

      {/* Metrics Highlights */}
      {metrics && (
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon blue">
              <Users size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{metrics.totalStudents}</span>
              <span className="stat-label">Registered Students</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon emerald">
              <BookOpen size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{metrics.scholarships.total}</span>
              <span className="stat-label">Total Scholarships ({metrics.scholarships.active} Active)</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <Layers size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{metrics.totalSavedScholarships}</span>
              <span className="stat-label">Student Bookmarks</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Shield size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{metrics.totalDocuments}</span>
              <span className="stat-label">Vault Documents</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'scholarships' ? 'active' : ''}`}
          onClick={() => setActiveTab('scholarships')}
        >
          <BookOpen size={18} />
          <span>Scholarship Management</span>
          <span className="tab-count">{scholarships.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          <span>User Directory</span>
          <span className="tab-count">{users.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 size={18} />
          <span>Reports & Analytics</span>
        </button>
      </div>

      {/* TAB 1: SCHOLARSHIP MANAGEMENT CRUD */}
      {activeTab === 'scholarships' && (
        <div>
          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search scholarship name, provider, ID..."
                value={schSearch}
                onChange={(e) => setSchSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={schStatusFilter}
              onChange={(e) => setSchStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Closed">Closed</option>
            </select>

            <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
              <Plus size={16} /> New Grant
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scholarship Name & Provider</th>
                  <th>Benefits</th>
                  <th>Criteria (State / Income)</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScholarships.map((sch) => (
                  <tr key={sch._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sch.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sch.provider} • ID: {sch.scholarshipId}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 600 }}>
                        {sch.benefits}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div>State: <strong>{sch.criteria?.state || 'All India'}</strong></div>
                      <div>Max Inc: <strong>₹{(sch.criteria?.minimumIncome / 100000).toFixed(1)}L</strong></div>
                      <div>Cats: <strong>{sch.criteria?.category?.join(', ')}</strong></div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(sch.deadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sch.status === 'Active'
                            ? 'badge-success'
                            : sch.status === 'Upcoming'
                            ? 'badge-primary'
                            : 'badge-neutral'
                        }`}
                      >
                        {sch.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <a
                          href={sch.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon"
                          title="Open portal link"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditModal(sch)}
                          title="Edit scholarship"
                          style={{ color: 'var(--primary)' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteScholarship(sch._id)}
                          title="Delete scholarship"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div>
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search user name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Student">Students Only</option>
              <option value="Admin">Administrators Only</option>
            </select>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Academic / Domicile Profile</th>
                  <th>Income & CGPA</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.email} {u.phone && `• ${u.phone}`}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${u.role === 'Admin' ? 'badge-primary' : 'badge-neutral'}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {u.role === 'Student' ? (
                        <>
                          <div><strong>Course:</strong> {u.course || 'N/A'} (Yr {u.year})</div>
                          <div><strong>State:</strong> {u.state || 'N/A'} • <strong>Cat:</strong> {u.category || 'N/A'}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Admin ID: {u.adminId || 'ADM'}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {u.role === 'Student' ? (
                        <>
                          <div style={{ color: '#15803d', fontWeight: 600 }}>
                            ₹{Number(u.income || 0).toLocaleString('en-IN')}/yr
                          </div>
                          <div>CGPA: <strong>{u.cgpa}</strong></div>
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u._id !== user?._id && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteUser(u._id)}
                          title="Delete user"
                          style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS & ANALYTICS */}
      {activeTab === 'metrics' && metrics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-cols-2">
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                Students by Social Category
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {metrics.categoryDistribution?.map((cat) => {
                  const pct = Math.round((cat.count / (metrics.totalStudents || 1)) * 100);
                  return (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        <span>{cat.category}</span>
                        <span>{cat.count} students ({pct}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--primary)',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                Geographical State Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {metrics.stateDistribution?.map((st) => {
                  const pct = Math.round((st.count / (metrics.totalStudents || 1)) * 100);
                  return (
                    <div key={st.state}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        <span>{st.state}</span>
                        <span>{st.count} students ({pct}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: '#059669',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Popular Scholarships */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
              Top Saved Scholarships by Students
            </h3>
            {metrics.popularScholarships?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No bookmark activity recorded yet.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Scholarship Name</th>
                      <th>Provider</th>
                      <th>Benefits</th>
                      <th style={{ textAlign: 'right' }}>Total Bookmarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.popularScholarships?.map((ps) => (
                      <tr key={ps._id}>
                        <td style={{ fontWeight: 600 }}>{ps.name}</td>
                        <td>{ps.provider}</td>
                        <td>
                          <span className="badge badge-success">{ps.benefits}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {ps.saveCount} saves
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT SCHOLARSHIP MODAL */}
      {isSchModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSchModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsSchModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSchFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Scholarship Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. National Merit Scholarship Scheme"
                    value={schForm.name}
                    onChange={(e) => setSchForm({ ...schForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Provider / Ministry *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ministry of Education"
                      value={schForm.provider}
                      onChange={(e) => setSchForm({ ...schForm, provider: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={schForm.status}
                      onChange={(e) => setSchForm({ ...schForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Financial Benefits Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹50,000 per annum + tuition fee waiver"
                    value={schForm.benefits}
                    onChange={(e) => setSchForm({ ...schForm, benefits: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Scope *</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="Brief details about the program objectives..."
                    value={schForm.description}
                    onChange={(e) => setSchForm({ ...schForm, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Application Deadline *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={schForm.deadline}
                      onChange={(e) => setSchForm({ ...schForm, deadline: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Application Link *</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://scholarships.gov.in"
                      value={schForm.applicationLink}
                      onChange={(e) => setSchForm({ ...schForm, applicationLink: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* CRITERIA SECTION */}
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    marginTop: '1rem',
                  }}
                >
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                    Eligibility Criteria Parameters
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Eligible Courses (comma-separated or 'All')</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Engineering, B.Tech, Medical, or All"
                      value={schForm.courseText}
                      onChange={(e) => setSchForm({ ...schForm, courseText: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Eligible Social Categories</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {CATEGORIES.map((cat) => {
                        const isSelected = schForm.categorySelected.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryToggle(cat)}
                            className={`badge ${isSelected ? 'badge-primary' : 'badge-neutral'}`}
                            style={{ cursor: 'pointer', padding: '0.4rem 0.75rem' }}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">State Domicile</label>
                      <select
                        className="form-select"
                        value={schForm.state}
                        onChange={(e) => setSchForm({ ...schForm, state: e.target.value })}
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Max Annual Family Income (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="800000"
                        value={schForm.minimumIncome}
                        onChange={(e) => setSchForm({ ...schForm, minimumIncome: Number(e.target.value) })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Min CGPA / Marks</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="6.0 or 60"
                        value={schForm.minimumMarks}
                        onChange={(e) => setSchForm({ ...schForm, minimumMarks: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Other Requirements / Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Regular college attendance, first-generation learner"
                      value={schForm.otherRequirements}
                      onChange={(e) => setSchForm({ ...schForm, otherRequirements: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSchModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingScholarship ? 'Save Changes' : 'Create Scholarship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
