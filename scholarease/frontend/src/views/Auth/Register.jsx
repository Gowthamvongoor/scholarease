import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Phone, ShieldCheck, AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
];

const Register = () => {
  const [role, setRole] = useState('Student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    course: 'B.Tech Computer Science',
    year: 1,
    state: 'Maharashtra',
    income: 250000,
    category: 'General',
    cgpa: 8.0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        role,
        year: Number(formData.year),
        income: Number(formData.income),
        cgpa: Number(formData.cgpa),
      };

      const user = await register(payload);
      if (user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
      }}
    >
      <div style={{ maxWidth: '620px', width: '100%' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              className="brand-icon"
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 1rem',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <GraduationCap size={30} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Create your ScholarEase Account
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Join thousands of students accessing national scholarships
            </p>
          </div>

          {/* Role selector tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              background: 'var(--bg-subtle)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.75rem',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('Student')}
              style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: role === 'Student' ? 'white' : 'transparent',
                color: role === 'Student' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: role === 'Student' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <BookOpen size={16} /> Student
            </button>
            <button
              type="button"
              onClick={() => setRole('Admin')}
              style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: role === 'Admin' ? 'white' : 'transparent',
                color: role === 'Admin' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: role === 'Admin' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <ShieldCheck size={16} /> Administrator
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="student@example.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password * (Min 6 chars)</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Student Specific Qualification Criteria Fields */}
            {role === 'Student' && (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-light)',
                }}
              >
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                  Academic & Eligibility Profile
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Degree / Course *</label>
                    <input
                      type="text"
                      name="course"
                      className="form-input"
                      placeholder="e.g. B.Tech Computer Science"
                      value={formData.course}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Study</label>
                    <select
                      name="year"
                      className="form-select"
                      value={formData.year}
                      onChange={handleChange}
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">State Domicile *</label>
                    <select
                      name="state"
                      className="form-select"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Social Category</label>
                    <select
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC (Other Backward Class)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                      <option value="Minority">Minority Community</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Annual Family Income (₹) *</label>
                    <input
                      type="number"
                      name="income"
                      className="form-input"
                      placeholder="250000"
                      value={formData.income}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current CGPA (0 - 10) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cgpa"
                      className="form-input"
                      placeholder="8.5"
                      value={formData.cgpa}
                      onChange={handleChange}
                      min="0"
                      max="10"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : `Register as ${role}`}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
