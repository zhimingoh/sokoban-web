import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Cell = 'wall' | 'floor' | 'target'
type Pos = { x: number; y: number }
type Level = {
  id: number
  width: number
  height: number
  cells: Cell[][]
  player: Pos
  boxes: Pos[]
}

const TOTAL_LEVELS = 100
const STORAGE_KEY = 'sokoban-progress-v1'

const dirMap: Record<string, Pos> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
}

const clonePos = (p: Pos): Pos => ({ x: p.x, y: p.y })

function generateLevel(id: number): Level {
  const width = 10
  const height = 10
  const cells: Cell[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ? 'wall' : 'floor',
    ),
  )

  const rng = seeded(id)
  const boxesCount = 1 + (id % 3)
  const rowStart = 2
  const targetRow = rowStart + Math.floor(rng() * (height - 4))
  const lane = Math.floor(rng() * 2) === 0 ? 1 : -1

  const player: Pos = { x: 2, y: targetRow }
  const boxes: Pos[] = []

  for (let i = 0; i < boxesCount; i++) {
    const y = Math.min(height - 3, Math.max(2, targetRow + i * lane))
    const targetX = width - 3
    cells[y][targetX] = 'target'
    boxes.push({ x: targetX - 1, y })
  }

  for (let n = 0; n < 6 + (id % 4); n++) {
    const wx = 2 + Math.floor(rng() * (width - 4))
    const wy = 2 + Math.floor(rng() * (height - 4))
    const safeLane = boxes.some((b) => b.y === wy && (wx >= b.x - 2 || wx >= width - 5))
    if (!safeLane && cells[wy][wx] === 'floor') {
      cells[wy][wx] = 'wall'
    }
  }

  return {
    id,
    width,
    height,
    cells,
    player,
    boxes,
  }
}

function seeded(seed: number) {
  let state = seed * 1664525 + 1013904223
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function isSame(a: Pos, b: Pos) {
  return a.x === b.x && a.y === b.y
}

function App() {
  const levels = useMemo(() => Array.from({ length: TOTAL_LEVELS }, (_, i) => generateLevel(i + 1)), [])
  const [levelIndex, setLevelIndex] = useState(0)
  const [player, setPlayer] = useState<Pos>(clonePos(levels[0].player))
  const [boxes, setBoxes] = useState<Pos[]>(levels[0].boxes.map(clonePos))
  const [steps, setSteps] = useState(0)
  const [history, setHistory] = useState<{ player: Pos; boxes: Pos[] }[]>([])
  const [unlocked, setUnlocked] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEY) || 1))

  const level = levels[levelIndex]

  useEffect(() => {
    setPlayer(clonePos(level.player))
    setBoxes(level.boxes.map(clonePos))
    setSteps(0)
    setHistory([])
  }, [level])

  const isWin = level.cells.every((row, y) =>
    row.every((cell, x) => (cell === 'target' ? boxes.some((b) => b.x === x && b.y === y) : true)),
  )

  useEffect(() => {
    if (isWin) {
      const next = Math.max(unlocked, levelIndex + 2)
      if (next !== unlocked && next <= TOTAL_LEVELS + 1) {
        setUnlocked(next)
        localStorage.setItem(STORAGE_KEY, String(next))
      }
    }
  }, [isWin, levelIndex, unlocked])

  function move(d: Pos) {
    if (isWin) return
    const next = { x: player.x + d.x, y: player.y + d.y }
    const cell = level.cells[next.y]?.[next.x]
    if (!cell || cell === 'wall') return

    const boxIndex = boxes.findIndex((b) => isSame(b, next))
    if (boxIndex >= 0) {
      const pushed = { x: next.x + d.x, y: next.y + d.y }
      const pushedCell = level.cells[pushed.y]?.[pushed.x]
      const blockedByBox = boxes.some((b) => isSame(b, pushed))
      if (!pushedCell || pushedCell === 'wall' || blockedByBox) return
      setHistory((h) => [...h, { player: clonePos(player), boxes: boxes.map(clonePos) }])
      const updated = boxes.map(clonePos)
      updated[boxIndex] = pushed
      setBoxes(updated)
      setPlayer(next)
      setSteps((s) => s + 1)
      return
    }

    setHistory((h) => [...h, { player: clonePos(player), boxes: boxes.map(clonePos) }])
    setPlayer(next)
    setSteps((s) => s + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = dirMap[e.key]
      if (!d) return
      e.preventDefault()
      move(d)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function undo() {
    const last = history.at(-1)
    if (!last) return
    setPlayer(last.player)
    setBoxes(last.boxes)
    setHistory((h) => h.slice(0, -1))
    setSteps((s) => Math.max(0, s - 1))
  }

  function reset() {
    setPlayer(clonePos(level.player))
    setBoxes(level.boxes.map(clonePos))
    setHistory([])
    setSteps(0)
  }

  return (
    <div className="app">
      <h1>推箱子 · Sokoban 100</h1>
      <div className="panel">
        <div>关卡：{level.id} / {TOTAL_LEVELS}</div>
        <div>步数：{steps}</div>
        <div>{isWin ? '🎉 通关！可进入下一关' : '方向键 / WASD 移动'}</div>
      </div>

      <div className="controls">
        <button onClick={() => setLevelIndex((i) => Math.max(0, i - 1))}>上一关</button>
        <button onClick={() => setLevelIndex((i) => Math.min(TOTAL_LEVELS - 1, i + 1))} disabled={!isWin && levelIndex + 2 > unlocked}>下一关</button>
        <button onClick={undo}>撤销</button>
        <button onClick={reset}>重置</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${level.width}, 1fr)` }}>
        {level.cells.flatMap((row, y) =>
          row.map((cell, x) => {
            const hasPlayer = player.x === x && player.y === y
            const hasBox = boxes.some((b) => b.x === x && b.y === y)
            const cls = ['cell', cell]
            if (hasBox) cls.push('box')
            if (hasPlayer) cls.push('player')
            if (hasBox && cell === 'target') cls.push('box-on-target')
            return <div key={`${x}-${y}`} className={cls.join(' ')} />
          }),
        )}
      </div>

      <div className="level-list">
        {levels.map((l, i) => {
          const locked = i + 1 > unlocked
          return (
            <button
              key={l.id}
              className={i === levelIndex ? 'active' : ''}
              disabled={locked}
              onClick={() => setLevelIndex(i)}
              title={locked ? '未解锁' : `第 ${l.id} 关`}
            >
              {l.id}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default App
