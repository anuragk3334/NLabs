import React, { useEffect, useState } from "react";
import { getMembers, createMember, updateMember } from "../api";
import Spinner from "./Spinner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 7 digits; allows +, spaces, dashes, dots, parentheses
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

function Members() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    loadMembers();
  }, []);

  function loadMembers() {
    setLoading(true);
    getMembers()
      .then((data) => setMembers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function clearForm() {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setError("");
    setFieldErrors({ name: "", email: "", phone: "" });
  }

  function startEdit(member) {
    setEditingId(member.id);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone || "");
    setError("");
    setFieldErrors({ name: "", email: "", phone: "" });
  }

  function validate() {
    const errors = { name: "", email: "", phone: "" };
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!phone.trim()) {
      errors.phone = "Phone is required.";
    } else if (!PHONE_RE.test(phone.trim())) {
      errors.phone = "Enter a valid phone number (7–20 digits; may include +, spaces, dashes).";
    }
    setFieldErrors(errors);
    return !errors.name && !errors.email && !errors.phone;
  }

  function save() {
    setError("");
    if (!validate()) return;

    setLoading(true);
    const member = { name, email, phone };

    const action = editingId ? updateMember(editingId, member) : createMember(member);

    action
      .then(() => {
        clearForm();
        loadMembers();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  return (
    <div>
      <div className="card">
        <h2>{editingId ? "Edit member" : "Add a member"}</h2>

        <div>
          <input
            placeholder="Name *"
            value={name}
            className={fieldErrors.name ? "input-error" : ""}
            onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
          />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </div>

        <div>
          <input
            placeholder="Email *"
            value={email}
            className={fieldErrors.email ? "input-error" : ""}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        <div>
          <input
            placeholder="Phone *"
            value={phone}
            className={fieldErrors.phone ? "input-error" : ""}
            onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: "" })); }}
          />
          {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
        </div>

        <div>
          <button onClick={save} disabled={loading}>{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button className="secondary" onClick={clearForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>

        {loading && <Spinner />}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Members</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.email}</td>
                <td>{member.phone || "-"}</td>
                <td>{member.joinedAt}</td>
                <td>
                  <button className="secondary" onClick={() => startEdit(member)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan="5">No members yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Members;
