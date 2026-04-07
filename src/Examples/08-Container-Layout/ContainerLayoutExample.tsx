import { useCallback, useState, useEffect } from 'react';
import {
    Background,
    ReactFlow,
    useNodesState,
    useEdgesState,
    Node,
    Controls,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { LayoutProvider, useLayoutContext } from '../../LayoutContext';
import { CONTAINER_CONFIGS, initialNodes, initialEdges } from './initialElements';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Randomise positions of all direct children of containerId. */
const scrambleContainerChildren = (nodes: Node[], containerId: string): Node[] =>
    nodes.map(node => {
        if (node.parentId !== containerId) return node;
        return {
            ...node,
            position: {
                x: Math.random() * 160 + 20,
                y: Math.random() * 220 + 20,
            },
        };
    });

// ── Panel (needs context — must live inside LayoutProvider) ──────────────────

function ContainerControls({ onScramble }: { onScramble: (id: string) => void }) {
    const { applyContainerLayout } = useLayoutContext();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                <b>Scramble</b> — перемешать детей контейнера.<br />
                <b>Layout</b> — пересчитать только этот контейнер<br />
                и всё его поддерево (любая глубина).
            </p>
            {CONTAINER_CONFIGS.map(({ id, label, color, bgColor, indent }) => (
                <div
                    key={id}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        marginLeft: indent * 16,
                        borderRadius: '6px',
                        backgroundColor: bgColor,
                        border: `1px solid ${color}`,
                    }}
                >
                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: '#333' }}>
                        {label}
                    </span>
                    <button
                        onClick={() => onScramble(id)}
                        style={{
                            padding: '3px 7px',
                            border: `1px solid ${color}`,
                            borderRadius: '4px',
                            background: 'white',
                            color: color,
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500,
                        }}
                    >
                        Scramble
                    </button>
                    <button
                        onClick={() => applyContainerLayout(id)}
                        style={{
                            padding: '3px 9px',
                            border: 'none',
                            borderRadius: '4px',
                            background: color,
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500,
                        }}
                    >
                        Layout
                    </button>
                </div>
            ))}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

const ContainerLayoutExample = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        setNodes(initialNodes as any[]);
        setInitialized(true);
    }, []);

    const updateNodes = useCallback((newNodes: Node[]) => {
        setNodes(newNodes as any[]);
    }, [setNodes]);

    /** Scramble direct children of the target container. */
    const scramble = useCallback((containerId: string) => {
        setNodes(prev =>
            scrambleContainerChildren(prev as Node[], containerId) as any[]
        );
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {initialized && (
                <LayoutProvider updateNodes={updateNodes} initialAutoLayout={true}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                    >
                        <Panel
                            position="top-left"
                            style={{
                                background: 'white',
                                padding: '12px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                minWidth: '280px',
                            }}
                        >
                            <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600 }}>
                                applyContainerLayout
                            </h3>
                            <ContainerControls onScramble={scramble} />
                        </Panel>
                        <Controls position="top-right" />
                        <Background />
                    </ReactFlow>
                </LayoutProvider>
            )}
        </div>
    );
};

export default ContainerLayoutExample;
