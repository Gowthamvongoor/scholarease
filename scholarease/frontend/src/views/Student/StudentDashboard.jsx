import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Bookmark,
  FileText,
  Upload,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Edit,
  Save,
  X,
  FileCheck,
  TrendingUp,
  Download,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScholarshipCard from '../../components/ScholarshipCard';
import EligibilityModal from '../../components/EligibilityModal';

const INDIAN_STATES = [
  'All',
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

const StudentDashboard = () => {
  const { user, updateStudentProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'saved', 'vault', 'profile'

  // Data states
  const [scholarships, setScholarships] = useState([]);
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterState, setFilterState] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [onlyEligible, setOnlyEligible] = useState(false);

  // Modals state
  const [selectedSchForEligibility, setSelectedSchForEligibility] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Document upload form state
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Income Certificate');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Profile edit form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    course: user?.course || '',
    year: user?.year || 1,
    state: user?.state || 'Maharashtra',
    income: user?.income || 250000,
    category: user?.category || 'General',
    cgpa: user?.cgpa || 8.0,
  });

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [schRes, savedRes, docRes] = await Promise.all([
        api.get('/scholarships'),
        api.get('/scholarships/saved/all'),
        api.get('/students/documents'),
      ]);

      if (schRes.data.success) setScholarships(schRes.data.scholarships || []);
      if (savedRes.data.success) setSavedScholarships(savedRes.data.savedScholarships || []);
      if (docRes.data.success) setDocuments(docRes.data.documents || []);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync profile form when user updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        course: user.course || '',
        year: user.year || 1,
        state: user.state || 'Maharashtra',
        income: user.income || 250000,
        category: user.category || 'General',
        cgpa: user.cgpa || 8.0,
      });
    }
  }, [user]);

  // Check if a scholarship is saved
  const isScholarshipSaved = (id) => {
    return savedScholarships.some(
      (s) => (s.scholarship?._id || s.scholarship) === id
    );
  };

  // Toggle Save / Unsave
  const handleToggleSave = async (scholarshipId) => {
    try {
      if (isScholarshipSaved(scholarshipId)) {
        await api.delete(`/scholarships/${scholarshipId}/save`);
        setSavedScholarships((prev) =>
          prev.filter((s) => (s.scholarship?._id || s.scholarship) !== scholarshipId)
        );
      } else {
        const res = await api.post(`/scholarships/${scholarshipId}/save`);
        if (res.data.success) {
          // Re-fetch saved to get full populated scholarship details
          const updatedSaved = await api.get('/scholarships/saved/all');
          if (updatedSaved.data.success) {
            setSavedScholarships(updatedSaved.data.savedScholarships || []);
          }
        }
      }
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  };

  // Document Upload Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadDocName.trim()) {
      setUploadMsg('Please specify a document name.');
      return;
    }

    try {
      setUploading(true);
      setUploadMsg('');

      const formData = new FormData();
      formData.append('documentName', uploadDocName);
      formData.append('documentType', uploadDocType);
      if (uploadFile) {
        formData.append('file', uploadFile);
      } else {
        // Fallback default mock file
        formData.append('filePath', `/uploads/doc_${Date.now()}.pdf`);
      }

      const res = await api.post('/students/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setDocuments((prev) => [res.data.document, ...prev]);
        setIsUploadModalOpen(false);
        setUploadDocName('');
        setUploadFile(null);
      }
    } catch (err) {
      setUploadMsg(err.response?.data?.message || 'Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to remove this document from your vault?')) return;
    try {
      const res = await api.delete(`/students/documents/${id}`);
      if (res.data.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      console.error('Delete document error:', err);
    }
  };

  // Profile Form Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateStudentProfile(profileForm);
      setIsEditProfileOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  // Client-Side Eligibility calculation helper for a single scholarship
  const checkEligibility = (sch) => {
    const c = sch.criteria || {};
    let passed = 0;
    const total = 5;

    // Course
    const coursePass =
      !c.course ||
      c.course.length === 0 ||
      c.course.some((cr) => cr.toLowerCase() === 'all') ||
      c.course.some(
        (cr) =>
          user?.course &&
          (user.course.toLowerCase().includes(cr.toLowerCase()) ||
            cr.toLowerCase().includes(user.course.toLowerCase()))
      );
    if (coursePass) passed++;

    // Category
    const catPass =
      !c.category ||
      c.category.length === 0 ||
      c.category.some((cat) => cat.toLowerCase() === 'all') ||
      c.category.some((cat) => cat.toLowerCase() === (user?.category || '').toLowerCase());
    if (catPass) passed++;

    // State
    const stPass =
      !c.state ||
      c.state.toLowerCase() === 'all india' ||
      c.state.toLowerCase() === 'all' ||
      c.state.toLowerCase() === (user?.state || '').toLowerCase();
    if (stPass) passed++;

    // Income
    const incPass = !c.minimumIncome || (user?.income || 0) <= c.minimumIncome;
    if (incPass) passed++;

    // Marks
    let marksPass = true;
    if (c.minimumMarks && c.minimumMarks > 0) {
      const cg = user?.cgpa || 0;
      marksPass = c.minimumMarks <= 10 ? cg >= c.minimumMarks : cg * 9.5 >= c.minimumMarks;
    }
    if (marksPass) passed++;

    return {
      isEligible: passed === total,
      passed,
      total,
      percentage: Math.round((passed / total) * 100),
    };
  };

  // Filtered scholarships
  const filteredScholarships = scholarships.filter((sch) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSearch =
        sch.name.toLowerCase().includes(q) ||
        sch.provider.toLowerCase().includes(q) ||
        sch.description.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // Category filter
    if (filterCategory !== 'All') {
      const schCats = sch.criteria?.category || ['All'];
      if (!schCats.includes('All') && !schCats.includes(filterCategory)) {
        return false;
      }
    }

    // State filter
    if (filterState !== 'All') {
      const schState = sch.criteria?.state || 'All India';
      if (schState !== 'All India' && schState !== 'All' && schState !== filterState) {
        return false;
      }
    }

    // Status filter
    if (filterStatus !== 'All') {
      if (sch.status !== filterStatus) return false;
    }

    // Only Eligible toggle
    if (onlyEligible) {
      const elig = checkEligibility(sch);
      if (!elig.isEligible) return false;
    }

    return true;
  });

  const totalEligibleCount = scholarships.filter((s) => checkEligibility(s).isEligible).length;

  return (
    <div className="main-content">
      {/* Student Overview Header */}
      <div className="page-header">
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
            Student Workspace
          </span>
          <h1 className="page-title">Welcome back, {user?.name}</h1>
          <p className="page-subtitle">
            {user?.course} • Year {user?.year} • {user?.state} • {user?.category} Category
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsEditProfileOpen(true)}
          >
            <Edit size={16} /> Edit Profile Criteria
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={16} /> Upload Document
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon emerald">
            <CheckCircle size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalEligibleCount}</span>
            <span className="stat-label">Eligible Scholarships</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <BookOpen size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{scholarships.length}</span>
            <span className="stat-label">Total Listed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Bookmark size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{savedScholarships.length}</span>
            <span className="stat-label">Saved Bookmarks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <FileText size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{documents.length}</span>
            <span className="stat-label">Vault Documents</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <BookOpen size={18} />
          <span>Scholarship Browser</span>
          <span className="tab-count">{filteredScholarships.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={18} />
          <span>Saved Scholarships</span>
          <span className="tab-count">{savedScholarships.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
          onClick={() => setActiveTab('vault')}
        >
          <FileText size={18} />
          <span>Document Vault</span>
          <span className="tab-count">{documents.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          <span>Profile & Academic Metrics</span>
        </button>
      </div>

      {/* TAB 1: SCHOLARSHIP BROWSER */}
      {activeTab === 'browse' && (
        <div>
          {/* Filters Bar */}
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search scholarship name, provider, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
              <option value="Minority">Minority</option>
            </select>

            <select
              className="filter-select"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All States' : st}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Upcoming">Upcoming</option>
            </select>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: onlyEligible ? 'var(--success-bg)' : 'transparent',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${onlyEligible ? 'var(--success-border)' : 'var(--border-medium)'}`,
                color: onlyEligible ? 'var(--success-text)' : 'var(--text-main)',
              }}
            >
              <input
                type="checkbox"
                checked={onlyEligible}
                onChange={(e) => setOnlyEligible(e.target.checked)}
              />
              Show 100% Eligible Only
            </label>
          </div>

          {/* Scholarship Cards Grid */}
          {filteredScholarships.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">
                <Search size={32} />
              </div>
              <h3 className="empty-title">No Scholarships Matched</h3>
              <p>Try adjusting your search query or loosening filter criteria.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setSearch('');
                  setFilterCategory('All');
                  setFilterState('All');
                  setFilterStatus('All');
                  setOnlyEligible(false);
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid-cols-2">
              {filteredScholarships.map((sch) => (
                <ScholarshipCard
                  key={sch._id}
                  scholarship={sch}
                  student={user}
                  isSaved={isScholarshipSaved(sch._id)}
                  onSave={handleToggleSave}
                  onOpenEligibility={(scholarship) => setSelectedSchForEligibility(scholarship)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED SCHOLARSHIPS */}
      {activeTab === 'saved' && (
        <div>
          {savedScholarships.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">
                <Bookmark size={32} />
              </div>
              <h3 className="empty-title">No Saved Scholarships</h3>
              <p>You haven't bookmarked any scholarships yet. Browse and save opportunities to track deadlines!</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={() => setActiveTab('browse')}
              >
                Browse Scholarships
              </button>
            </div>
          ) : (
            <div className="grid-cols-2">
              {savedScholarships.map((item) => {
                const sch = item.scholarship;
                if (!sch) return null;
                return (
                  <ScholarshipCard
                    key={sch._id}
                    scholarship={sch}
                    student={user}
                    isSaved={true}
                    onSave={handleToggleSave}
                    onOpenEligibility={(scholarship) => setSelectedSchForEligibility(scholarship)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENT VAULT */}
      {activeTab === 'vault' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Student Document Vault</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Keep your official verification certificates ready for direct scholarship application.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload size={16} /> Upload New Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">
                <FileText size={32} />
              </div>
              <h3 className="empty-title">Document Vault is Empty</h3>
              <p>Upload income proofs, caste certificates, and marksheets for fast eligibility verification.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Category / Type</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>File Action</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc._id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={18} style={{ color: 'var(--primary)' }} />
                          {doc.documentName}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{doc.documentType}</span>
                      </td>
                      <td>
                        {new Date(doc.uploadDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            doc.status === 'Verified'
                              ? 'badge-success'
                              : doc.status === 'Pending'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '0.35rem' }}
                        >
                          <Download size={14} /> View File
                        </a>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteDocument(doc._id)}
                          title="Delete document"
                          style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE & CRITERIA DETAILS */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: '800px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Profile & Qualification Metrics</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ScholarEase matches scholarships in real time based on these parameters.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditProfileOpen(true)}
            >
              <Edit size={14} /> Edit Information
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              background: 'var(--bg-subtle)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FULL NAME</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{user?.name}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>EMAIL ADDRESS</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{user?.email}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTACT NUMBER</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{user?.phone || 'Not provided'}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEGREE / COURSE</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{user?.course}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>YEAR OF STUDY</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>Year {user?.year}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DOMICILE STATE</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{user?.state}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOCIAL CATEGORY</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{user?.category}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ANNUAL FAMILY INCOME</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem', color: '#15803d' }}>
                ₹{Number(user?.income || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT CGPA</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem', color: 'var(--primary)' }}>
                {user?.cgpa} / 10.0
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ELIGIBILITY BREAKDOWN MODAL */}
      <EligibilityModal
        scholarship={selectedSchForEligibility}
        student={user}
        isOpen={!!selectedSchForEligibility}
        onClose={() => setSelectedSchForEligibility(null)}
        onSave={handleToggleSave}
        isSaved={selectedSchForEligibility ? isScholarshipSaved(selectedSchForEligibility._id) : false}
      />

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Verification Document</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsUploadModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                {uploadMsg && (
                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--danger-bg)',
                      border: '1px solid var(--danger-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--danger-text)',
                      fontSize: '0.85rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {uploadMsg}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Document Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Income Certificate 2026"
                    value={uploadDocName}
                    onChange={(e) => setUploadDocName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Document Category / Type *</label>
                  <select
                    className="form-select"
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                  >
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Caste Certificate">Caste Certificate</option>
                    <option value="Marksheet / Transcript">Marksheet / Transcript</option>
                    <option value="Identity Proof (Aadhaar/PAN)">Identity Proof (Aadhaar/PAN)</option>
                    <option value="Domicile Certificate">Domicile Certificate</option>
                    <option value="College Bonafide / ID">College Bonafide / ID</option>
                    <option value="Fee Receipt">Fee Receipt</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select File (PDF, PNG, JPG)</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Maximum file size: 10MB
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditProfileOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Student Eligibility Profile</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsEditProfileOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Degree / Course</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.course}
                      onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select
                      className="form-select"
                      value={profileForm.year}
                      onChange={(e) => setProfileForm({ ...profileForm, year: Number(e.target.value) })}
                    >
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                      <option value="5">Year 5</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Domicile State</label>
                    <select
                      className="form-select"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    >
                      {INDIAN_STATES.filter((s) => s !== 'All').map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Social Category</label>
                    <select
                      className="form-select"
                      value={profileForm.category}
                      onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                      <option value="Minority">Minority</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Annual Family Income (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={profileForm.income}
                      onChange={(e) => setProfileForm({ ...profileForm, income: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CGPA (0 - 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={profileForm.cgpa}
                      onChange={(e) => setProfileForm({ ...profileForm, cgpa: Number(e.target.value) })}
                      min="0"
                      max="10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
