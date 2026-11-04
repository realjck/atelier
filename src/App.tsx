import { useState } from "react";
import { Header } from "./components/Header";

function App() {
  const [query, setQuery] = useState("");
  return (
    <div className="app">
      <Header query={query} onQueryChange={setQuery} onNewProject={() => {}} />
    </div>
  );
}

export default App;
