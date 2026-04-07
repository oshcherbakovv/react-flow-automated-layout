const edgeType = 'smoothstep';
const pos = { x: 0, y: 0 };

export const CONTAINER_CONFIGS = [
  { id: 'container-a', label: 'Container A (flat)',    color: '#4CAF50', bgColor: '#e8f5e9', indent: 0 },
  { id: 'container-b', label: 'Container B (nested)',  color: '#2196F3', bgColor: '#e3f2fd', indent: 0 },
  { id: 'sub-b1',      label: '↳ Sub B1',              color: '#64B5F6', bgColor: '#f0f7ff', indent: 1 },
  { id: 'sub-b2',      label: '↳ Sub B2 (deep)',       color: '#90CAF9', bgColor: '#f5f9ff', indent: 1 },
  { id: 'sub-b2-deep', label: '  ↳ Sub B2 / Deep',    color: '#BBDEFB', bgColor: '#fafcff', indent: 2 },
  { id: 'container-c', label: 'Container C (flat)',    color: '#FF9800', bgColor: '#fff3e0', indent: 0 },
];

export const initialNodes = [
  // ── Top-level containers (no parent) ────────────────────────────────────

  {
    id: 'container-a',
    type: 'group',
    data: {},
    position: pos,
    style: { width: 260, height: 360, border: '2px solid #4CAF50', borderRadius: '8px', backgroundColor: 'rgba(76,175,80,0.04)' },
  },
  {
    id: 'container-b',
    type: 'group',
    data: {},
    position: pos,
    style: { width: 520, height: 480, border: '2px solid #2196F3', borderRadius: '8px', backgroundColor: 'rgba(33,150,243,0.04)' },
  },
  {
    id: 'container-c',
    type: 'group',
    data: {},
    position: pos,
    style: { width: 260, height: 280, border: '2px solid #FF9800', borderRadius: '8px', backgroundColor: 'rgba(255,152,0,0.04)' },
  },

  // ── Container A: flat chain  a1 → a2 → a3 → a4 ──────────────────────────
  { id: 'a1', data: { label: 'A: Start' },  position: pos, type: 'input',  parentId: 'container-a', extent: 'parent' as const },
  { id: 'a2', data: { label: 'A: Step 1' }, position: pos,                 parentId: 'container-a', extent: 'parent' as const },
  { id: 'a3', data: { label: 'A: Step 2' }, position: pos,                 parentId: 'container-a', extent: 'parent' as const },
  { id: 'a4', data: { label: 'A: End' },    position: pos, type: 'output', parentId: 'container-a', extent: 'parent' as const },

  // ── Container B: two sub-containers + own nodes ──────────────────────────
  { id: 'b-start', data: { label: 'B: Entry' }, position: pos, type: 'input',  parentId: 'container-b', extent: 'parent' as const },
  { id: 'b-end',   data: { label: 'B: Exit' },  position: pos, type: 'output', parentId: 'container-b', extent: 'parent' as const },

  //   Sub B1 (one level deep)
  {
    id: 'sub-b1',
    type: 'group',
    data: {},
    position: pos,
    parentId: 'container-b',
    extent: 'parent' as const,
    style: { width: 220, height: 220, border: '2px solid #64B5F6', borderRadius: '6px', backgroundColor: 'rgba(100,181,246,0.06)' },
  },
  { id: 'sb1-1', data: { label: 'B1: Node 1' }, position: pos, parentId: 'sub-b1', extent: 'parent' as const },
  { id: 'sb1-2', data: { label: 'B1: Node 2' }, position: pos, parentId: 'sub-b1', extent: 'parent' as const },
  { id: 'sb1-3', data: { label: 'B1: Node 3' }, position: pos, parentId: 'sub-b1', extent: 'parent' as const },

  //   Sub B2 (one level deep) — itself contains a deeper container
  {
    id: 'sub-b2',
    type: 'group',
    data: {},
    position: pos,
    parentId: 'container-b',
    extent: 'parent' as const,
    style: { width: 220, height: 280, border: '2px solid #90CAF9', borderRadius: '6px', backgroundColor: 'rgba(144,202,249,0.06)' },
  },
  { id: 'sb2-top', data: { label: 'B2: Top' }, position: pos, parentId: 'sub-b2', extent: 'parent' as const },

  //     Sub B2 / Deep (two levels deep inside container-b)
  {
    id: 'sub-b2-deep',
    type: 'group',
    data: {},
    position: pos,
    parentId: 'sub-b2',
    extent: 'parent' as const,
    style: { width: 180, height: 160, border: '2px solid #BBDEFB', borderRadius: '4px', backgroundColor: 'rgba(187,222,251,0.08)' },
  },
  { id: 'deep-1', data: { label: 'Deep: X' }, position: pos, parentId: 'sub-b2-deep', extent: 'parent' as const },
  { id: 'deep-2', data: { label: 'Deep: Y' }, position: pos, parentId: 'sub-b2-deep', extent: 'parent' as const },
  { id: 'deep-3', data: { label: 'Deep: Z' }, position: pos, parentId: 'sub-b2-deep', extent: 'parent' as const },

  // ── Container C: flat diamond  c1 → c2/c3 → c4 ──────────────────────────
  { id: 'c1', data: { label: 'C: Source' }, position: pos, type: 'input',  parentId: 'container-c', extent: 'parent' as const },
  { id: 'c2', data: { label: 'C: Path A' }, position: pos,                 parentId: 'container-c', extent: 'parent' as const },
  { id: 'c3', data: { label: 'C: Path B' }, position: pos,                 parentId: 'container-c', extent: 'parent' as const },
  { id: 'c4', data: { label: 'C: Merge' },  position: pos, type: 'output', parentId: 'container-c', extent: 'parent' as const },
];

export const initialEdges = [
  // Container A
  { id: 'ea1-2',  source: 'a1', target: 'a2', type: edgeType, animated: true },
  { id: 'ea2-3',  source: 'a2', target: 'a3', type: edgeType, animated: true },
  { id: 'ea3-4',  source: 'a3', target: 'a4', type: edgeType, animated: true },

  // Container B — entry/exit connect to sub-containers
  { id: 'eb-s1',   source: 'b-start', target: 'sub-b1', type: edgeType, animated: true },
  { id: 'eb-s2',   source: 'b-start', target: 'sub-b2', type: edgeType, animated: true },
  { id: 'eb1-end', source: 'sub-b1',  target: 'b-end',  type: edgeType, animated: true },
  { id: 'eb2-end', source: 'sub-b2',  target: 'b-end',  type: edgeType, animated: true },

  // Sub B1 (internal)
  { id: 'sb1-12', source: 'sb1-1', target: 'sb1-2', type: edgeType, animated: true },
  { id: 'sb1-23', source: 'sb1-2', target: 'sb1-3', type: edgeType, animated: true },

  // Sub B2 (internal)
  { id: 'sb2-td', source: 'sb2-top', target: 'sub-b2-deep', type: edgeType, animated: true },

  // Deep level (internal)
  { id: 'ed-12', source: 'deep-1', target: 'deep-2', type: edgeType, animated: true },
  { id: 'ed-13', source: 'deep-1', target: 'deep-3', type: edgeType, animated: true },

  // Container C
  { id: 'ec1-2', source: 'c1', target: 'c2', type: edgeType, animated: true },
  { id: 'ec1-3', source: 'c1', target: 'c3', type: edgeType, animated: true },
  { id: 'ec2-4', source: 'c2', target: 'c4', type: edgeType, animated: true },
  { id: 'ec3-4', source: 'c3', target: 'c4', type: edgeType, animated: true },
];
