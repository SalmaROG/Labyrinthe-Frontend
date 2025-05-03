import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  const [labyrinthe, setLabyrinthe] = useState([]); 
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [selecting, setSelecting] = useState("start");
  const [error, setError] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("solve_dijkstra");
  const [visitedCells, setVisitedCells] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPath, setShowPath] = useState(false);

  //Fonction pour initialiser un labyrinthe vide
  const initializeLabyrinth = () => {
    const emptyLabyrinth = Array(16)
      .fill()
      .map(() => Array(40).fill(" "));
    setLabyrinthe(emptyLabyrinth);
    setStart(null);
    setEnd(null);
    setSelecting("start");
    setError(null);
    setVisitedCells([]);
    setCurrentStep(0);
    setShowPath(false);
  };

  //Initialisation au chargement
  useEffect(() => {
    initializeLabyrinth();
  }, []);

  //Générer un labyrinthe avec obstacles
  const generateLabyrinth = () => {
    if (!start || !end) {
      setError("Veuillez sélectionner un point de départ et un point d'arrivée.");
      return;
    }

    setVisitedCells([]);
    fetch("http://localhost:8080/labyrinthe", {
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
        setLabyrinthe(data.labyrinthe);
        setError(null);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError("Erreur lors de la génération du labyrinthe.");
      });
  };

  // Réinitialiser tout le labyrinthe pour recommencer
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

  const solveLabyrinth = () => {
    if (!start || !end) {
      setError("Veuillez sélectionner un point de départ et un point d'arrivée.");
      return;
    }

    fetch("http://localhost:8080/labyrinthe", {
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
        console.log("Backend response:", data); // Log the backend response
        if (!data.labyrinthe || !Array.isArray(data.labyrinthe)) {
          throw new Error("Invalid labyrinth data received from the backend");
        }
        setLabyrinthe(data.labyrinthe);
        setVisitedCells(data.cases_visitees || []);
        setCurrentStep(0);
        setShowPath(false);
        setError(null);

        //Afficher les cases visitées une par une
        const interval = setInterval(() => {
          setCurrentStep((prevStep) => {
            if (prevStep >= data.cases_visitees.length - 1) {
              clearInterval(interval);
              setShowPath(true); // Afficher le chemin trouvé
              return prevStep;
            }
            return prevStep + 1;
          });
        }, 10); //Ajustez l'intervalle selon vos besoins
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setError("Erreur lors de la résolution du labyrinthe.");
      });
  };

  const renderPath = () => {
    if (!labyrinthe || !Array.isArray(labyrinthe) || labyrinthe.length === 0 || !showPath) {
      return null; // Ne rien afficher si le chemin n'est pas prêt
    }
  
    return (
      <>
        {labyrinthe.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (
              cell === "P" &&
              !(start && rowIndex === start.row && colIndex === start.col) && // Exclure le départ
              !(end && rowIndex === end.row && colIndex === end.col) // Exclure l'arrivée
            ) {
              return (
                <div
                  key={`path-${rowIndex}-${colIndex}`}
                  style={{
                    width: "30px",
                    height: "30px",
                    backgroundColor: "orange", // Chemin trouvé
                    border: "1px solid gray",
                    position: "absolute",
                    top: `${rowIndex * 31.2}px`, // Assure un bon alignement
                    left: `${colIndex * 30}px`,
                  }}
                />
              );
            }
            return null;
          })
        )}
      </>
    );
  };
  

  // Affichage du labyrinthe (cases visitées, départ, arrivée, murs)
  const renderLabyrinthe = () => {
    if (!labyrinthe || !Array.isArray(labyrinthe) || labyrinthe.length === 0) {
      return <div>Chargement...</div>;
    }

    return (
      <div style={{ position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${labyrinthe[0].length}, 30px)` }}>
          {labyrinthe.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              let color = "white";

              // Priorité 1 : Départ (S) et Arrivée (E)
              if (start && rowIndex === start.row && colIndex === start.col) color = "green";
              else if (end && rowIndex === end.row && colIndex === end.col) color = "red";

              // Priorité 2 : Cases visitées (bleu clair)
              const isVisited = visitedCells.some(
                (visited) => visited.row === rowIndex && visited.col === colIndex
              );
              if (
                isVisited &&
                currentStep >= visitedCells.findIndex(
                  (visited) => visited.row === rowIndex && visited.col === colIndex
                ) &&
                !(start && rowIndex === start.row && colIndex === start.col) && // Exclure le départ
                !(end && rowIndex === end.row && colIndex === end.col) // Exclure l'arrivée
              ) {
                color = "lightblue";
              }
              // Priorité 3 : Murs (#)
              if (cell === "#") color = "black"; // Mur

              return (
                <div
                  key={'${rowIndex}-${colIndex}'}
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
        {renderPath()} {/* Afficher le chemin trouvé par-dessus la grille */}
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

      {renderLabyrinthe()} {/* Afficher le labyrinthe avec le chemin */}
    </div>
  );
};

export default App;