import React, { useEffect, useState } from "react";
import { getBooks, getMembers, getLoans, borrowBook, returnBook } from "../api";
import Spinner from "./Spinner";

function formatDate(d) {
  if (!d) return "";
  // backend returns ISO datetimes for borrowedAt, and plain dates for dueDate.
  // Normalize to YYYY-MM-DD for display.
  try {
    return d.split("T")[0];
  } catch (e) {
    return d;
  }
}

function SearchableSelect({ options, value, onChange, placeholder, renderOption, disabledOption }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => String(o.id) === String(value))?.label ?? "";

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="searchable-select" style={{ position: "relative" }}>
      <input
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => {
          setOpen(false);
          setQuery("");
        }, 150)}
      />
      {open && (
        <ul className="ss-options" style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          position: "absolute",
          zIndex: 20,
          background: "white",
          border: "1px solid #ccc",
          width: "100%",
          maxHeight: 200,
          overflow: "auto"
        }}>
          {filtered.map((opt) => (
            <li
              key={opt.id}
              onMouseDown={() => {
                if (disabledOption && disabledOption(opt)) return;
                onChange(String(opt.id));
                setQuery(opt.label);
                setOpen(false);
              }}
              style={{ padding: "6px 8px", cursor: disabledOption && disabledOption(opt) ? "not-allowed" : "pointer", opacity: disabledOption && disabledOption(opt) ? 0.6 : 1 }}
            >
              {renderOption ? renderOption(opt) : opt.label}
            </li>
          ))}
          {filtered.length === 0 && <li style={{ padding: 8, color: "#666" }}>No matches</li>}
        </ul>
      )}
    </div>
  );
}
function Loans() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Borrow form
  const [bookId, setBookId] = useState("");
  const [memberId, setMemberId] = useState("");

  // Filters
  const [filterMemberId, setFilterMemberId] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // Load dropdown data once.
  useEffect(() => {
    getBooks().then(setBooks).catch((err) => setError(err.message));
    getMembers().then(setMembers).catch((err) => setError(err.message));
  }, []);

  // Reload the loan list whenever the filters change.
  useEffect(() => {
    loadLoans();
  }, [filterMemberId, activeOnly]);

  function loadLoans() {
    setLoading(true);
    // Pass explicit null when filterMemberId is empty so the API receives no member filter.
    getLoans(filterMemberId === "" ? null : filterMemberId, activeOnly)
      .then(setLoans)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // After borrow/return, book availability changes too, so refresh both.
  function refreshAll() {
    setLoading(true);
    getBooks().then(setBooks);
    getLoans(filterMemberId === "" ? null : filterMemberId, activeOnly)
      .then(setLoans)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function borrow() {
    setError("");
    if (!bookId || !memberId) {
      setError("Please choose both a book and a member.");
      return;
    }

    setLoading(true);
    borrowBook(Number(bookId), Number(memberId))
      .then(() => {
        setBookId("");
        setMemberId("");
        refreshAll();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  function doReturn(loan) {
    setError("");
    setLoading(true);
    returnBook(loan.id)
      .then(refreshAll)
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  return (
    <div>
        <div className="card">
        <h2>Borrow a book</h2>
        <SearchableSelect
          options={books.map((b) => ({ id: b.id, label: `${b.title} (${b.availableCopies} available)`, raw: b }))}
          value={bookId}
          onChange={(id) => setBookId(id)}
          placeholder="Choose a book"
          renderOption={(opt) => (
            <div>
              <div>{opt.label}</div>
            </div>
          )}
          disabledOption={(opt) => opt.raw && opt.raw.availableCopies === 0}
        />

        <div style={{ height: 8 }} />

        <SearchableSelect
          options={members.map((m) => ({ id: m.id, label: `${m.name}${m.email ? ' — ' + m.email : ''}${m.phone ? ' — ' + m.phone : ''}`, raw: m }))}
          value={memberId}
          onChange={(id) => setMemberId(id)}
          placeholder="Choose a member"
          renderOption={(opt) => (
            <div>
              <div>{opt.label}</div>
            </div>
          )}
        />

        <button onClick={borrow} disabled={loading}>Borrow</button>
        {loading && <Spinner />}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Loans</h2>

        <div style={{ marginBottom: "12px", display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 220 }}>
            Show:{" "}
            <SearchableSelect
              options={[{ id: '', label: 'All members' }, ...members.map((m) => ({ id: m.id, label: `${m.name}${m.email ? ' — ' + m.email : ''}${m.phone ? ' — ' + m.phone : ''}`, raw: m }))]}
              value={filterMemberId}
              onChange={(id) => setFilterMemberId(id)}
              placeholder="All members"
            />
          </div>

          <label style={{ marginLeft: "10px" }}>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />{" "}
            Currently borrowed only
          </label>
        </div>

        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>ISBN</th>
              <th>Member</th>
              <th>Borrowed date</th>
              <th>Due date</th>
              <th>Return date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.bookTitle}</td>
                <td>{loan.bookIsbn || ""}</td>
                <td>{loan.memberName}</td>
                <td>{formatDate(loan.borrowedAt)}</td>
                <td>{formatDate(loan.dueDate)}</td>
                <td>{formatDate(loan.returnedAt)}</td>
                <td>
                  {loan.status === "RETURNED" && <span>Returned</span>}
                  {loan.status === "BORROWED" && loan.overdue && (
                    <span className="overdue">Overdue</span>
                  )}
                  {loan.status === "BORROWED" && !loan.overdue && <span>Borrowed</span>}
                </td>
                <td>
                  {loan.status === "BORROWED" && (
                    <button onClick={() => doReturn(loan)} disabled={loading}>Return</button>
                  )}
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr>
                <td colSpan="8">No loans to show.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Loans;
