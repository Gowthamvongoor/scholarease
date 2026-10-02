import React from 'react';
import { Calendar, DollarSign, Bookmark, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

const ScholarshipCard = ({
  scholarship,
  student,
  isSaved,
  onSave,
  onOpenDetails,
  onOpenEligibility,
}) => {
  const criteria = scholarship.criteria || {};

  // Quick Client-Side Eligibility Check
  const calculateClientEligibility = () => {
    if (!student) return null;

    let points = 0;
    const total = 5;

    // Course
    const coursePass =
      !criteria.course ||
      criteria.course.length === 0 ||
      criteria.course.some((c) => c.toLowerCase() === 'all') ||
      criteria.course.some(
        (c) =>
          student.course &&
          (student.course.toLowerCase().includes(c.toLowerCase()) ||
            c.toLowerCase().includes(student.course.toLowerCase()))
      );
    if (coursePass) points++;

    // Category
    const categoryPass =
      !criteria.category ||
      criteria.category.length === 0 ||
      criteria.category.some((c) => c.toLowerCase() === 'all') ||
      criteria.category.some((cat) => cat.toLowerCase() === (student.category || '').toLowerCase());
    if (categoryPass) points++;

    // State
    const statePass =
      !criteria.state ||
      criteria.state.toLowerCase() === 'all india' ||
      criteria.state.toLowerCase() === 'all' ||
      criteria.state.toLowerCase() === (student.state || '').toLowerCase();
    if (statePass) points++;

    // Income
    const incomePass =
      !criteria.minimumIncome ||
      criteria.minimumIncome <= 0 ||
      (student.income || 0) <= criteria.minimumIncome;
    if (incomePass) points++;

    // Marks
    let marksPass = true;
    if (criteria.minimumMarks && criteria.minimumMarks > 0) {
      const studentCgpa = student.cgpa || 0;
      if (criteria.minimumMarks <= 10) {
        marksPass = studentCgpa >= criteria.minimumMarks;
      } else {
        marksPass = studentCgpa * 9.5 >= criteria.minimumMarks;
      }
    }
    if (marksPass) points++;

    const percent = Math.round((points / total) * 100);
    return {
      isEligible: points === total,
      percent,
    };
  };

  const clientEligibility = calculateClientEligibility();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="scholarship-card">
      <div>
        <div className="sch-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span
                className={`badge ${
                  scholarship.status === 'Active'
                    ? 'badge-success'
                    : scholarship.status === 'Upcoming'
                    ? 'badge-primary'
                    : 'badge-neutral'
                }`}
              >
                {scholarship.status}
              </span>

              {clientEligibility && (
                <span
                  className={`badge ${
                    clientEligibility.isEligible
                      ? 'badge-success'
                      : clientEligibility.percent >= 60
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onOpenEligibility(scholarship)}
                  title="Click to view detailed criteria breakdown"
                >
                  {clientEligibility.isEligible ? (
                    <>
                      <CheckCircle2 size={12} /> 100% Eligible
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} /> {clientEligibility.percent}% Match
                    </>
                  )}
                </span>
              )}
            </div>

            <h3 className="sch-name">{scholarship.name}</h3>
          </div>

          {onSave && (
            <button
              type="button"
              className={`btn-icon ${isSaved ? 'text-primary' : ''}`}
              onClick={() => onSave(scholarship._id)}
              title={isSaved ? 'Saved to vault' : 'Save scholarship'}
              style={{
                background: isSaved ? 'var(--primary-light)' : 'var(--bg-subtle)',
                color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <div className="sch-provider">{scholarship.provider}</div>

        <div className="sch-benefits">
          <DollarSign size={16} />
          <span>{scholarship.benefits}</span>
        </div>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {scholarship.description}
        </p>

        <div className="sch-criteria-tags">
          <span className="sch-tag">
            State: <strong>{criteria.state || 'All India'}</strong>
          </span>
          <span className="sch-tag">
            Category: <strong>{criteria.category?.join(', ') || 'All'}</strong>
          </span>
          {criteria.minimumIncome && (
            <span className="sch-tag">
              Max Income: <strong>₹{(criteria.minimumIncome / 100000).toFixed(1)}L/yr</strong>
            </span>
          )}
          {criteria.minimumMarks && (
            <span className="sch-tag">
              Min Score: <strong>{criteria.minimumMarks}{criteria.minimumMarks <= 10 ? ' CGPA' : '%'}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="sch-footer">
        <div className="sch-deadline">
          <Calendar size={14} />
          <span>Deadline: {formatDate(scholarship.deadline)}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenEligibility(scholarship)}
          >
            Check Match
          </button>
          <a
            href={scholarship.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            Apply <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipCard;
