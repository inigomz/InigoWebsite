"""Interactive pathfinding visualizer. Run with: python pathfinding_visualizer.py."""

import heapq
import itertools
import random
import tkinter as tk
from collections import deque
from collections.abc import Generator
from dataclasses import dataclass, field
from tkinter import ttk
from typing import cast

Cell = tuple[int, int]
SearchEvent = tuple[str, Cell]


@dataclass(frozen=True)
class SearchGrid:
    """Describe the grid data needed by a pathfinding search."""

    rows: int
    cols: int
    start: Cell
    goal: Cell
    walls: set[Cell]
    weights: set[Cell]


@dataclass(frozen=True)
class SearchResult:
    """Store the completed route and its search statistics."""

    path: list[Cell]
    visited: int
    cost: int


@dataclass
class BoardState:
    """Store editable terrain and temporary visualization state."""

    start: Cell = (12, 7)
    goal: Cell = (12, 34)
    walls: set[Cell] = field(default_factory=set)
    weights: set[Cell] = field(default_factory=set)
    overlay: dict[Cell, str] = field(default_factory=dict)


@dataclass
class AnimationState:
    """Track drawing gestures and scheduled animation work."""

    running: bool = False
    timer: str | None = None
    last_cell: Cell | None = None


@dataclass
class Controls:
    """Group the Tkinter variables controlled by toolbar widgets."""

    algorithm: tk.StringVar
    tool: tk.StringVar
    speed: tk.IntVar
    status: tk.StringVar


def neighbors(cell: Cell, grid: SearchGrid) -> list[Cell]:
    """Return orthogonal neighbors that remain inside the grid."""
    row, column = cell
    candidates = (
        (row - 1, column),
        (row + 1, column),
        (row, column - 1),
        (row, column + 1),
    )
    return [
        candidate
        for candidate in candidates
        if 0 <= candidate[0] < grid.rows
        and 0 <= candidate[1] < grid.cols
    ]


def breadth_first_steps(
    grid: SearchGrid,
) -> Generator[SearchEvent, None, SearchResult]:
    """Yield animation events while running breadth first search."""
    previous: dict[Cell, Cell] = {}
    distance = {grid.start: 0}
    seen: set[Cell] = set()
    queued = {grid.start}
    frontier = deque([grid.start])

    while frontier:
        current = frontier.popleft()
        seen.add(current)
        yield "visited", current

        if current == grid.goal:
            break

        for next_cell in neighbors(current, grid):
            if next_cell in grid.walls or next_cell in queued:
                continue

            # The first breadth first route to a cell is the shortest route.
            queued.add(next_cell)
            previous[next_cell] = current
            distance[next_cell] = distance[current] + 1
            frontier.append(next_cell)
            yield "frontier", next_cell

    return build_result(grid, previous, distance, seen)


def priority_search_steps(
    algorithm: str,
    grid: SearchGrid,
) -> Generator[SearchEvent, None, SearchResult]:
    """Yield events while running Dijkstra or A star search."""
    previous: dict[Cell, Cell] = {}
    distance = {grid.start: 0}
    seen: set[Cell] = set()
    order = itertools.count()
    frontier = [(0, next(order), grid.start)]

    while frontier:
        _priority, _order, current = heapq.heappop(frontier)
        if current in seen:
            continue

        seen.add(current)
        yield "visited", current

        if current == grid.goal:
            break

        for next_cell in neighbors(current, grid):
            if next_cell in grid.walls:
                continue

            step_cost = 5 if next_cell in grid.weights else 1
            new_cost = distance[current] + step_cost
            if new_cost >= distance.get(next_cell, 10**9):
                continue

            distance[next_cell] = new_cost
            previous[next_cell] = current
            heuristic = calculate_heuristic(algorithm, next_cell, grid.goal)
            priority = new_cost + heuristic
            heapq.heappush(
                frontier,
                (priority, next(order), next_cell),
            )
            yield "frontier", next_cell

    return build_result(grid, previous, distance, seen)


def calculate_heuristic(algorithm: str, cell: Cell, goal: Cell) -> int:
    """Return the Manhattan heuristic for A star and zero otherwise."""
    if algorithm != "A*":
        return 0
    return abs(cell[0] - goal[0]) + abs(cell[1] - goal[1])


def build_result(
    grid: SearchGrid,
    previous: dict[Cell, Cell],
    distance: dict[Cell, int],
    seen: set[Cell],
) -> SearchResult:
    """Reconstruct a path and combine it with search statistics."""
    path: list[Cell] = []
    if grid.goal == grid.start or grid.goal in previous:
        path = [grid.goal]
        while path[-1] != grid.start:
            path.append(previous[path[-1]])
        path.reverse()

    cost = distance.get(grid.goal, 0) if path else 0
    return SearchResult(path, len(seen), cost)


def search_steps(
    algorithm: str,
    grid: SearchGrid,
) -> Generator[SearchEvent, None, SearchResult]:
    """Select a search algorithm and yield its animation events."""
    if algorithm == "BFS":
        return (yield from breadth_first_steps(grid))
    return (yield from priority_search_steps(algorithm, grid))


class App:
    """Display and control the interactive pathfinding visualizer."""

    ROWS = 24
    COLS = 42
    SIZE = 24
    COLORS = {
        "empty": "#f6f4ef",
        "wall": "#24262b",
        "weight": "#826aed",
        "start": "#16a085",
        "goal": "#e45858",
        "frontier": "#f2c14e",
        "visited": "#70c1d4",
        "path": "#ff8c42",
    }

    def __init__(self, root: tk.Tk) -> None:
        """Create application state, toolbar widgets, and the drawing canvas."""
        self.root = root
        self.board = BoardState()
        self.animation = AnimationState()
        self.controls = Controls(
            algorithm=tk.StringVar(value="A*"),
            tool=tk.StringVar(value="Wall"),
            speed=tk.IntVar(value=18),
            status=tk.StringVar(
                value="Draw obstacles, then press Visualize."
            ),
        )
        self.canvas = tk.Canvas(
            root,
            width=self.COLS * self.SIZE,
            height=self.ROWS * self.SIZE,
            highlightthickness=0,
        )

        self.configure_window()
        self.create_toolbar()
        self.create_canvas()

    def configure_window(self) -> None:
        """Configure the fixed size application window."""
        self.root.title("Pathfinding Visualizer")
        self.root.configure(bg="#17191e")
        self.root.resizable(False, False)

    def create_toolbar(self) -> None:
        """Create algorithm controls and action buttons."""
        toolbar = tk.Frame(
            self.root,
            bg="#17191e",
            padx=16,
            pady=12,
        )
        toolbar.pack(fill="x")

        tk.Label(
            toolbar,
            text="PATHFINDING LAB",
            fg="white",
            bg="#17191e",
            font=("Segoe UI", 15, "bold"),
        ).grid(row=0, column=0, padx=(0, 18))

        ttk.Combobox(
            toolbar,
            textvariable=self.controls.algorithm,
            values=("BFS", "Dijkstra", "A*"),
            width=10,
            state="readonly",
        ).grid(row=0, column=1, padx=4)

        ttk.Combobox(
            toolbar,
            textvariable=self.controls.tool,
            values=("Wall", "Weight", "Erase", "Move start", "Move goal"),
            width=12,
            state="readonly",
        ).grid(row=0, column=2, padx=4)

        actions = (
            ("Visualize", self.visualize),
            ("Random maze", self.maze),
            ("Clear path", self.clear),
            ("Reset", self.reset),
        )
        for column, (text, command) in enumerate(actions, 3):
            ttk.Button(
                toolbar,
                text=text,
                command=command,
            ).grid(row=0, column=column, padx=4)

        self.create_speed_control(toolbar)
        tk.Label(
            toolbar,
            textvariable=self.controls.status,
            fg="#aeb2bd",
            bg="#17191e",
        ).grid(
            row=1,
            column=0,
            columnspan=9,
            sticky="w",
            pady=(8, 0),
        )

    def create_speed_control(self, toolbar: tk.Frame) -> None:
        """Create the animation speed label and slider."""
        tk.Label(
            toolbar,
            text="Speed",
            fg="white",
            bg="#17191e",
        ).grid(row=0, column=7, padx=(14, 2))

        tk.Scale(
            toolbar,
            variable=self.controls.speed,
            from_=1,
            to=50,
            orient="horizontal",
            showvalue=False,
            length=100,
            bg="#17191e",
            highlightthickness=0,
        ).grid(row=0, column=8)

    def create_canvas(self) -> None:
        """Place the grid canvas and register editing gestures."""
        self.canvas.pack(padx=16, pady=(0, 16))
        self.canvas.bind("<Button-1>", self.edit)
        self.canvas.bind("<B1-Motion>", self.edit)
        self.canvas.bind("<ButtonRelease-1>", self.end_edit)
        self.draw()

    def end_edit(self, _event: tk.Event) -> None:
        """Allow the next drag gesture to edit its first cell."""
        self.animation.last_cell = None

    def edit(self, event: tk.Event) -> None:
        """Apply the selected editing tool to the cell under the pointer."""
        if self.animation.running:
            return

        cell = (event.y // self.SIZE, event.x // self.SIZE)
        if not self.is_editable_event(cell):
            return

        self.animation.last_cell = cell
        tool = self.controls.tool.get()
        if tool == "Move start" and cell != self.board.goal:
            self.board.start = cell
        elif tool == "Move goal" and cell != self.board.start:
            self.board.goal = cell
        elif cell not in (self.board.start, self.board.goal):
            self.edit_terrain(tool, cell)

        self.board.overlay.clear()
        self.draw()

    def is_editable_event(self, cell: Cell) -> bool:
        """Return whether a pointer event identifies a new valid cell."""
        if cell == self.animation.last_cell:
            return False
        return (
            0 <= cell[0] < self.ROWS
            and 0 <= cell[1] < self.COLS
        )

    def edit_terrain(self, tool: str, cell: Cell) -> None:
        """Add or remove wall and weight terrain at one cell."""
        if tool == "Wall":
            self.board.weights.discard(cell)
            self.board.walls.add(cell)
        elif tool == "Weight":
            self.board.walls.discard(cell)
            self.board.weights.add(cell)
        elif tool == "Erase":
            self.board.walls.discard(cell)
            self.board.weights.discard(cell)

    def draw(self) -> None:
        """Redraw the complete grid from current application state."""
        self.canvas.delete("all")
        for row in range(self.ROWS):
            for column in range(self.COLS):
                self.draw_cell((row, column))
        self.draw_endpoint_labels()

    def draw_cell(self, cell: Cell) -> None:
        """Draw one grid cell using its highest priority visual state."""
        kind = self.board.overlay.get(cell, "empty")
        if cell in self.board.walls:
            kind = "wall"
        elif cell in self.board.weights:
            kind = "weight"

        if cell == self.board.start:
            kind = "start"
        elif cell == self.board.goal:
            kind = "goal"

        row, column = cell
        x_coordinate = column * self.SIZE
        y_coordinate = row * self.SIZE
        self.canvas.create_rectangle(
            x_coordinate,
            y_coordinate,
            x_coordinate + self.SIZE,
            y_coordinate + self.SIZE,
            fill=self.COLORS[kind],
            outline="#d9d6cf",
        )
        if kind == "weight":
            self.canvas.create_text(
                x_coordinate + 12,
                y_coordinate + 12,
                text="5",
                fill="white",
            )

    def draw_endpoint_labels(self) -> None:
        """Draw the start and goal labels above their cell colors."""
        for cell, label in (
            (self.board.start, "S"),
            (self.board.goal, "G"),
        ):
            self.canvas.create_text(
                cell[1] * self.SIZE + 12,
                cell[0] * self.SIZE + 12,
                text=label,
                fill="white",
                font=("Segoe UI", 10, "bold"),
            )

    def current_grid(self) -> SearchGrid:
        """Build an immutable search description from the current board."""
        return SearchGrid(
            rows=self.ROWS,
            cols=self.COLS,
            start=self.board.start,
            goal=self.board.goal,
            walls=self.board.walls,
            weights=self.board.weights,
        )

    def visualize(self) -> None:
        """Start an animated run of the selected search algorithm."""
        if self.animation.running:
            return

        self.clear()
        self.animation.running = True
        steps = search_steps(
            self.controls.algorithm.get(),
            self.current_grid(),
        )
        self.controls.status.set("Searching...")

        def advance() -> None:
            try:
                kind, cell = next(steps)
                if cell not in (self.board.start, self.board.goal):
                    self.board.overlay[cell] = kind
                self.draw()
                delay = max(1, 51 - self.controls.speed.get())
                self.animation.timer = self.root.after(delay, advance)
            except StopIteration as completed:
                result = cast(SearchResult, completed.value)
                self.paint_result(result)

        advance()

    def paint_result(self, result: SearchResult) -> None:
        """Begin painting a completed search result."""
        self.paint(
            result.path,
            result.visited,
            result.cost,
        )

    def paint(
        self,
        path: list[Cell],
        visited: int,
        cost: int,
        index: int = 1,
    ) -> None:
        """Animate the final path and display completed search statistics."""
        if index < len(path) - 1:
            self.board.overlay[path[index]] = "path"
            self.draw()
            self.animation.timer = self.root.after(
                24,
                self.paint,
                path,
                visited,
                cost,
                index + 1,
            )
            return

        self.animation.running = False
        self.animation.timer = None
        if path:
            message = f"Path found - cost {cost} - {visited} explored"
        else:
            message = f"No path found - {visited} explored"
        self.controls.status.set(message)

    def clear(self) -> None:
        """Cancel animation and clear temporary search visualization."""
        if self.animation.timer:
            self.root.after_cancel(self.animation.timer)
        self.animation.timer = None
        self.animation.running = False
        self.board.overlay.clear()
        self.controls.status.set(
            "Draw obstacles, then press Visualize."
        )
        self.draw()

    def maze(self) -> None:
        """Replace terrain with a randomly generated wall layout."""
        self.clear()
        self.board.weights.clear()
        self.board.walls = {
            (row, column)
            for row in range(self.ROWS)
            for column in range(self.COLS)
            if random.random() < 0.27
            and (row, column) not in (self.board.start, self.board.goal)
        }
        self.draw()

    def reset(self) -> None:
        """Restore an empty board with the original endpoint positions."""
        self.clear()
        self.board.walls.clear()
        self.board.weights.clear()
        self.board.start = (12, 7)
        self.board.goal = (12, 34)
        self.draw()


def main() -> None:
    """Create the application and run the Tkinter event loop."""
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
