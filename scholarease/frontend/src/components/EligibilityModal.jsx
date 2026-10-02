import React from 'react';
import { X, CheckCircle2, XCircle, ExternalLink, Bookmark, Award, AlertCircle } from 'lucide-react';

const EligibilityModal = ({ scholarship, student, isOpen, onClose, onSave, isSaved }) => {
  if (!isOpen || !scholarship) return null;

  const criteria = scholarship.criteria || {};

  // Evaluate Course match
  const checkCourse = () => {
    if (!criteria.course || criteria.course.length === 0 || criteria.course.some(c => c.toLowerCase() === 'all')) {
      return { pass: true, detail: 'Open to all academic courses' };
    }
    const studentCourse = (student?.course || '').toLowerCase();
    const match = criteria.course.some(c => studentCourse.includes(c.toLowerCase()) || c.toLowerCase().includes(studentCourse));
    return {
      pass: match,
      detail: match
        ? `Your course (${student?.course}) matches: ${criteria.course.join(', ')}`
        : `Requires course in: ${criteria.course.join(', ')} (Your course: ${student?.course || 'Not specified'})`,
    };
  };

  // Evaluate Category match
  const checkCategory = () => {
    if (!criteria.category || criteria.category.length === 0 || criteria.category.some(c => c.toLowerCase() === 'all')) {
      return { pass: true, detail: 'Applicable for all social categories' };
    }
    const match = criteria.category.some(c => c.toLowerCase() === (student?.category || '').toLowerCase());
    return {
      pass: match,
      detail: match
        ? `Your category (${student?.category}) is included`
        : `Only for: ${criteria.category.join(', ')} (Your category: ${student?.category || 'Not specified'})`,
    };
  };

  // Evaluate State match
  const checkState = () => {
    const schState = criteria.state || 'All India';
    if (schState.toLowerCase() === 'all india' || schState.toLowerCase() === 'all' || !schState.trim()) {
      return { pass: true, detail: 'Nationwide eligibility (All Indian States/UTs)' };
    }
    const match = schState.toLowerCase() === (student?.state || '').toLowerCase();
    return {
      pass: match,
      detail: match
        ? `Matches your domicile state (${student?.state})`
        : `Restricted to domicile of: ${schState} (Your state: ${student?.state || 'Not specified'})`,
    };
  };

  // Evaluate Income match
  const checkIncome = () => {
    if (!criteria.minimumIncome || criteria.minimumIncome <= 0) {
      return { pass: true, detail: 'No family income threshold restriction' };
    }
    const studentIncome = student?.income || 0;
    const pass = studentIncome <= criteria.minimumIncome;
    return {
      pass,
      detail: pass
        ? `Family income ₹${studentIncome.toLocaleString('en-IN')} is within ₹${criteria.minimumIncome.toLocaleString('en-IN')} ceiling`
        : `Income ₹${studentIncome.toLocaleString('en-IN')} exceeds limit of ₹${criteria.minimumIncome.toLocaleString('en-IN')}`,
    };
  };

  // Evaluate Marks / CGPA match
  const checkMarks = () => {
    if (!criteria.minimumMarks || criteria.minimumMarks <= 0) {
      return { pass: true, detail: 'No minimum score threshold requirement' };
    }
    const studentCgpa = student?.cgpa || 0;
    const req = criteria.minimumMarks;
    let pass = false;
    if (req <= 10) {
      pass = studentCgpa >= req;
    } else {
      pass = (studentCgpa * 9.5) >= req;
    }
    return {
      pass,
      detail: pass
        ? `Your CGPA (${studentCgpa}) satisfies the academic benchmark (min ${req})`
        : `Your CGPA (${studentCgpa}) is below required mark of ${req}`,
    };
  };

  const results = [
    { label: 'Course Eligibility', ...checkCourse() },
    { label: 'Social Category', ...checkCategory() },
    { label: 'State Domicile', ...checkState() },
    { label: 'Annual Income Limit', ...checkIncome() },
    { label: 'Academic Performance (CGPA)', ...checkMarks() },
  ];

  const passedCount = results.filter(r => r.pass).length;
  const matchPercentage = Math.round((passedCount / results.length) * 100);
  const isFullyEligible = passedCount === results.length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
              Eligibility Report
            </span>
            <h3 className="modal-title">{scholarship.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Provider: {scholarship.provider}
            </p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Match Score Banner */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: isFullyEligible ? 'var(--success-bg)' : matchPercentage >= 60 ? 'var(--warning-bg)' : 'var(--danger-bg)',
              border: `1px solid ${isFullyEligible ? 'var(--success-border)' : matchPercentage >= 60 ? 'var(--warning-border)' : 'var(--danger-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isFullyEligible ? (
                <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
              ) : (
                <AlertCircle
                  size={32}
                  style={{ color: matchPercentage >= 60 ? 'var(--warning)' : 'var(--danger)' }}
                />
              )}
              <div>
                <h4
                  style={{
                    fontWeight: 700,
                    color: isFullyEligible ? 'var(--success-text)' : matchPercentage >= 60 ? 'var(--warning-text)' : 'var(--danger-text)',
                  }}
                >
                  {isFullyEligible
                    ? '100% Eligible to Apply'
                    : `${matchPercentage}% Eligibility Match`}
                </h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: isFullyEligible ? 'var(--success-text)' : matchPercentage >= 60 ? 'var(--warning-text)' : 'var(--danger-text)',
                  }}
                >
                  {isFullyEligible
                    ? 'All academic and socio-economic criteria match your profile perfectly.'
                    : `Meets ${passedCount} of ${results.length} required qualification criteria.`}
                </p>
              </div>
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: isFullyEligible ? 'var(--success-text)' : matchPercentage >= 60 ? 'var(--warning-text)' : 'var(--danger-text)',
              }}
            >
              {matchPercentage}%
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Criteria Verification Breakdown
          </h4>

          <div className="eligibility-box">
            {results.map((res, idx) => (
              <div key={idx} className="criteria-item">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                  {res.pass ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--success)', marginTop: '0.15rem' }} />
                  ) : (
                    <XCircle size={18} style={{ color: 'var(--danger)', marginTop: '0.15rem' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{res.label}</div>
                    <div style={{ fontSize: '0.8rem', color: res.pass ? 'var(--text-muted)' : 'var(--danger-text)' }}>
                      {res.detail}
                    </div>
                  </div>
                </div>
                <span className={`badge ${res.pass ? 'badge-success' : 'badge-danger'}`}>
                  {res.pass ? 'Satisfied' : 'Not Met'}
                </span>
              </div>
            ))}
          </div>

          {criteria.otherRequirements && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <strong>Other Notes / Special Conditions:</strong> {criteria.otherRequirements}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {onSave && (
            <button
              type="button"
              className={`btn ${isSaved ? 'btn-danger-outline' : 'btn-outline'}`}
              onClick={() => onSave(scholarship._id)}
            >
              <Bookmark size={16} />
              {isSaved ? 'Remove from Saved' : 'Save Scholarship'}
            </button>
          )}
          <a
            href={scholarship.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Apply on Official Portal <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default EligibilityModal;
