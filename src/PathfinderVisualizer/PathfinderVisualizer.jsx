import React, { Component } from "react";
import Node from "./Node/Node";
import "./PathfinderVisualizer.css";
import { dijkstra, getNodesInShortestPathOrder } from "../Algorithms/dijkstra";

export default class PathfinderVisualizer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      grid: [],
      mouseIsPressed: false,
      movingStart: false,
      movingFinish: false,
      startNodeRow: 10,
      startNodeCol: 15,
      finishNodeRow: 10,
      finishNodeCol: 35,
    };
  }

  componentDidMount() {
    const { startNodeRow, startNodeCol, finishNodeRow, finishNodeCol } =
      this.state;
    const grid = getInitialGrid(
      startNodeRow,
      startNodeCol,
      finishNodeRow,
      finishNodeCol
    );
    this.setState({ grid });
  }

  handleMouseDown = (row, col) => {
    const node = this.state.grid[row][col];
    if (node.isStart) {
      this.setState({ movingStart: true, mouseIsPressed: true });
    } else if (node.isFinish) {
      this.setState({ movingFinish: true, mouseIsPressed: true });
    } else {
      const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
      this.setState({ grid: newGrid, mouseIsPressed: true });
    }
  };

  handleMouseEnter = (row, col) => {
    if (!this.state.mouseIsPressed) return;
    const { movingStart, movingFinish, grid } = this.state;

    if (movingStart || movingFinish) {
      const newGrid = grid.slice();

      for (const rowArr of newGrid)
        for (let node of rowArr) {
          if (movingStart) node.isStart = false;
          if (movingFinish) node.isFinish = false;
        }

      if (movingStart) {
        newGrid[row][col].isStart = true;
        this.setState({ startNodeRow: row, startNodeCol: col });
      }
      if (movingFinish) {
        newGrid[row][col].isFinish = true;
        this.setState({ finishNodeRow: row, finishNodeCol: col });
      }

      this.setState({ grid: newGrid });
      return; // exit early, don’t place walls
    }

    const newGrid = getNewGridWithWallToggled(grid, row, col);
    this.setState({ grid: newGrid });
  };

  handleMouseUp = () => {
    this.setState({
      mouseIsPressed: false,
      movingStart: false,
      movingFinish: false,
    });
  };

  animateDijkstra(visitedNodesInorder, nodesInShortestPathOrder) {
    for (let i = 0; i <= visitedNodesInorder.length; i++) {
      if (i === visitedNodesInorder.length) {
        setTimeout(() => {
          this.animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInorder[i];
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-visited";
      }, 10 * i);
    }
  }

  animateShortestPath(nodesInShortestPathOrder) {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-shortest-path";
      }, 50 * i);
    }
  }

  visualizeDijkstra() {
    const { grid } = this.state;
    const { startNodeRow, startNodeCol, finishNodeRow, finishNodeCol } =
      this.state;
    const startNode = grid[startNodeRow][startNodeCol];
    const finishNode = grid[finishNodeRow][finishNodeCol];
    const visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
    const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
    this.animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder);
  }

  resetGrid() {
    const { startNodeRow, startNodeCol, finishNodeRow, finishNodeCol } =
      this.state;

    const newGrid = getInitialGrid(
      startNodeRow,
      startNodeCol,
      finishNodeRow,
      finishNodeCol
    );

    // Reset DOM classes for all nodes
    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[0].length; col++) {
        const node = newGrid[row][col];
        const element = document.getElementById(`node-${row}-${col}`);
        if (element) {
          let className = "node";
          if (node.isStart) className += " node-start";
          if (node.isFinish) className += " node-finish";
          element.className = className;
        }
      }
    }

    this.setState({ grid: newGrid });
  }

  render() {
    const { grid, mouseIsPressed } = this.state;

    return (
      <>
        <div className="button-container">
          <button className="btn" onClick={() => this.visualizeDijkstra()}>
            Visualize Dijkstra's Algorithm
          </button>
          <button className="btn" onClick={() => this.resetGrid()}>
            Reset Grid
          </button>
        </div>
        <div className="grid">
          {grid.map((row, rowIdx) => {
            return (
              <div key={rowIdx} className="row">
                {row.map((node, nodeIdx) => {
                  const { row, col, isFinish, isStart, isWall } = node;
                  return (
                    <Node
                      key={nodeIdx}
                      col={col}
                      isFinish={isFinish}
                      isStart={isStart}
                      isWall={isWall}
                      mouseIsPressed={mouseIsPressed}
                      onMouseDown={(row, col) => this.handleMouseDown(row, col)}
                      onMouseEnter={(row, col) =>
                        this.handleMouseEnter(row, col)
                      }
                      onMouseUp={() => this.handleMouseUp()}
                      row={row}
                    ></Node>
                  );
                })}
              </div>
            );
          })}
        </div>
      </>
    );
  }
}

const getInitialGrid = (startRow, startCol, finishRow, finishCol) => {
  const grid = [];
  for (let row = 0; row < 20; row++) {
    const currentRow = [];
    for (let col = 0; col < 50; col++) {
      currentRow.push(
        createNode(col, row, startRow, startCol, finishRow, finishCol)
      );
    }
    grid.push(currentRow);
  }
  return grid;
};

const createNode = (col, row, startRow, startCol, finishRow, finishCol) => {
  return {
    col,
    row,
    isStart: row === startRow && col === startCol,
    isFinish: row === finishRow && col === finishCol,
    distance: Infinity,
    isVisited: false,
    isWall: false,
    previousNode: null,
  };
};

const getNewGridWithWallToggled = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  const newNode = {
    ...node,
    isWall: !node.isWall,
  };
  newGrid[row][col] = newNode;
  return newGrid;
};
