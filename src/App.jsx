import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  const [labyrinthe, setLabyrinthe] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [selecting, setSelecting] = useState("start");
  const [error, setError] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("solve_dijkstra");

  // Fonction pour initialiser un labyrinthe vide
  const initializeLabyrinth = () => {
    const emptyLabyrinth = Array(16)
      .fill()
      .map(() => Array(40).fill(" "));
    setLabyrinthe(emptyLabyrinth);
    setStart(null);
    setEnd(null);
    setSelecting("start");
    setError(null);
  };

  // Initialisation au chargement
  useEffect(() => {
    initializeLabyrinth();
  }, []);

  // Générer un labyrinthe avec obstacles
  const generateLabyrinth = () => {
    if (!start || !end) {
      setError("Veuillez sélectionner un point de départ et un point d'arrivée.");
      return;
    }

    fetch("http://localhost:5000/labyrinthe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate",
        start: { row: start.row, col: start.col },
        end: { row: end.row, col: end.col },
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setLabyrinthe(data);
        setError(null);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError("Erreur lors de la génération du labyrinthe.");
      });
  };

  //Réinitialiser tout le labyrinthe pour recommencer
  const resetLabyrinth = () => {
    initializeLabyrinth();
  };

  //Sélectionner le point de départ et d'arrivée
  const handleCellClick = (rowIndex, colIndex) => {
    if (selecting === "start") {
      setStart({ row: rowIndex, col: colIndex });
      setSelecting("end");
    } else if (selecting === "end") {
      setEnd({ row: rowIndex, col: colIndex });
      setSelecting(null);
    }
  };

  //Envoyer les coordonnées au backend pour résoudre le labyrinthe
  const solveLabyrinth = () => {
    if (!start || !end) {
      setError("Veuillez sélectionner un point de départ et un point d'arrivée.");
      return;
    }

    fetch("http://localhost:5000/labyrinthe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: selectedAlgorithm,
        start: { row: start.row, col: start.col },
        end: { row: end.row, col: end.col },
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setLabyrinthe(data);
        setError(null);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError("Erreur lors de la résolution du labyrinthe.");
      });
  };

  //Affichage du labyrinthe sous forme de grille
  const renderLabyrinthe = () => {
    if (!labyrinthe) return <div>Chargement...</div>;

    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${labyrinthe[0].length}, 30px)` }}>
        {labyrinthe.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            let color = "white";
            if (start && rowIndex === start.row && colIndex === start.col) color = "green";
            else if (end && rowIndex === end.row && colIndex === end.col) color = "red";
            else if (cell === "#") color = "black";
            else if (cell === "S") color = "green"; // Start
            else if (cell === "E") color = "red"; // End
            else if (cell === "P") color = "orange"; // Path

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  width: "30px",
                  height: "30px",
                  backgroundColor: color,
                  border: "1px solid gray",
                  cursor: selecting ? "pointer" : "default",
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              />
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="labyrinthe">
      {/* Partie supérieure contenant la barre des boutons */}
      <div
        style={{
          padding: "20px",
          color: "white",
          display: "flex",
          flexDirection: "row",  
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <button onClick={resetLabyrinth} style={{ padding: "10px", fontSize: "16px" }}>
          Réinitialiser Labyrinthe
        </button>

        <button onClick={generateLabyrinth} style={{ padding: "10px", fontSize: "16px" }}>
          Générer obstacles
        </button>
        {/* Liste déroulante et bouton Résoudre dans un seul bouton */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            style={{ padding: "10px", fontSize: "16px", borderRadius: "5px" }}
          >
            <option value="solve_dijkstra">Dijkstra</option>
            <option value="solve_bfs">BFS</option>
          </select>

          <button onClick={solveLabyrinth} style={{ padding: "10px", fontSize: "16px", marginLeft: "10px" }}>
            Résoudre
          </button>
        </div>
      </div>

      {error && <div style={{ color: "red", textAlign: "center", marginTop: "20px" }}>{error}</div>}

      {renderLabyrinthe()}
    </div>
  );
};

export default App;
