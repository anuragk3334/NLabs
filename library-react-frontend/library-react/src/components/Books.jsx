import React, { useEffect, useState } from "react";
import { getBooks, createBook, updateBook } from "../api";
import Spinner from "./Spinner";

function Books() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [copies, setCopies] = useState(1);

  const [fieldErrors, setFieldErrors] = useState({ title: "", author: "" });

  useEffect(() => {
    loadBooks();
  }, []);

  function loadBooks() {
    setLoading(true);
    getBooks()
      .then((data) => setBooks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function clearForm() {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setIsbn("");
    setCopies(1);
    setError("");
    setFieldErrors({ title: "", author: "" });
  }

  function startEdit(book) {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn || "");
    setCopies(book.totalCopies);
    setError("");
    setFieldErrors({ title: "", author: "" });
  }

  function validate() {
    const errors = { title: "", author: "" };
    if (!title.trim()) errors.title = "Title is required.";
    if (!author.trim()) errors.author = "Author is required.";
    setFieldErrors(errors);
    return !errors.title && !errors.author;
  }

  function save() {
    setError("");
    if (!validate()) return;

    setLoading(true);
    const book = { title, author, isbn, totalCopies: Number(copies) };

    const action = editingId ? updateBook(editingId, book) : createBook(book);

    action
      .then(() => {
        clearForm();
        loadBooks();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  return (
    <div>
      <div className="card">
        <h2>{editingId ? "Edit book" : "Add a book"}</h2>

        <div>
          <input
            placeholder="Title *"
            value={title}
            className={fieldErrors.title ? "input-error" : ""}
            onChange={(e) => { setTitle(e.target.value); setFieldErrors((p) => ({ ...p, title: "" })); }}
          />
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </div>

        <div>
          <input
            placeholder="Author *"
            value={author}
            className={fieldErrors.author ? "input-error" : ""}
            onChange={(e) => { setAuthor(e.target.value); setFieldErrors((p) => ({ ...p, author: "" })); }}
          />
          {fieldErrors.author && <span className="field-error">{fieldErrors.author}</span>}
        </div>

        <input placeholder="ISBN (optional)" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
        <input
          type="number"
          min="1"
          placeholder="Copies"
          value={copies}
          onChange={(e) => setCopies(e.target.value)}
          style={{ width: "80px" }}
        />

        <div>
          <button onClick={save} disabled={loading}>
            {editingId ? "Update" : "Add"}
          </button>
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
        <h2>Books</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>ISBN</th>
              <th>Available / Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.isbn || "-"}</td>
                <td>
                  {book.availableCopies} / {book.totalCopies}
                </td>
                <td>
                  <button className="secondary" onClick={() => startEdit(book)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan="5">No books yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Books;
