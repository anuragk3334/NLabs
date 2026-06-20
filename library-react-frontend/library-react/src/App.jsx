import React, { useState } from "react";
import Books from "./components/Books";
import Members from "./components/Members";
import Loans from "./components/Loans";

function App() {
  // Which tab is showing. Kept as simple state - no router needed for 3 screens.
  const [tab, setTab] = useState("books");

  return (
    <div>
      <div className="navbar">
        <h1>Neighborhood Library</h1>
        <button onClick={() => setTab("books")}>Books</button>
        <button onClick={() => setTab("members")}>Members</button>
        <button onClick={() => setTab("loans")}>Loans</button>
      </div>

      <div className="container">
        {tab === "books" && <Books />}
        {tab === "members" && <Members />}
        {tab === "loans" && <Loans />}
      </div>
    </div>
  );
}

export default App;
