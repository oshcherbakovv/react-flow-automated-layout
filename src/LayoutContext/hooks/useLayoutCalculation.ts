import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { LayoutDirection, LayoutEngine } from '../context/LayoutContext';
import { convertDirection } from '../utils/layoutProviderUtils';
import { organizeLayoutRecursively, organizeLayoutByTreeDepth, layoutSingleContainer } from '../core/HierarchicalLayoutOrganizer';
import { buildNodeTree } from '../utils/treeUtils';
import filterSelectedParentNodes from '../utils/filterSelectedParentNodes';
import { createGlobalTemporaryEdgesMap } from '../utils/temporaryEdgeMapCreator';

// Layout configuration object for simplification
export interface LayoutConfig {
  dagreDirection: string;
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>;
  nodeIdWithNode: Map<string, Node>;
  nodes: Node[];
  edges: Edge[];
  margin: number;
  nodeSpacing: number;
  layerSpacing: number;
  nodeWidth: number;
  nodeHeight: number;
  layoutHidden?: boolean;
  noParentKey?: string;
}

/**
 * Process selected node IDs for layout calculations (refactored to use LayoutConfig)
 */
export const processSelectedNodes = async (
  selectedNodes: Node[],
  config: LayoutConfig,
  signal?: AbortSignal
): Promise<{ nodes: Node[], edges: Edge[] }> => {
  const {
    dagreDirection,
    nodeParentIdMapWithChildIdSet,
    nodeIdWithNode,
    nodes,
    edges,
    margin,
    nodeSpacing,
    layerSpacing,
    nodeWidth,
    nodeHeight,
    layoutHidden = false,
    noParentKey = 'no-parent',
  } = config;

  // Filter to only include relevant parent nodes
  const filteredParentIds = filterSelectedParentNodes(
    selectedNodes,
    nodeParentIdMapWithChildIdSet,
    nodeIdWithNode,
    noParentKey
  );
  if (filteredParentIds.length === 0) {
    return { nodes, edges };
  }
  // Map to track updated nodes and edges (using node/edge ID as key for faster lookups)
  const updatedNodesMap = new Map<string, Node>();
  const updatedEdgesMap = new Map<string, Edge>();
  
  // Process each parent in parallel, but check for abort signal before starting
  if (signal?.aborted) {
    return { nodes, edges };
  }

  const results = await Promise.all(
    filteredParentIds.map(async parentId => {
      if (signal?.aborted) {
        return { updatedNodes: [], updatedEdges: [] };
      }
      return organizeLayoutRecursively(
        parentId,
        dagreDirection as any,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        edges,
        margin,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        undefined,
        layoutHidden
      );
    })
  );
  
  // Collect all results from parallel processing
  results.forEach(({ updatedNodes, updatedEdges }) => {
    updatedNodes.forEach(node => {
      updatedNodesMap.set(node.id, node);
    });
    updatedEdges.forEach(edge => {
      updatedEdgesMap.set(edge.id, edge);
    });
  });

  const updatedNodes = nodes.map(node =>
    updatedNodesMap.has(node.id) ? updatedNodesMap.get(node.id)! : node
  );
  const updatedEdges = edges.map(edge =>
    updatedEdgesMap.has(edge.id) ? updatedEdgesMap.get(edge.id)! : edge
  );
  return { nodes: updatedNodes, edges: updatedEdges };
};

/**
 * Hook for layout calculation functionality
 */
export const useLayoutCalculation = (
  layoutEngines: Record<string, LayoutEngine>,
  direction: LayoutDirection,
  algorithm: string,
  parentResizingOptions: any,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  nodeIdWithNode: Map<string, Node>,
  nodeSpacing: number,
  layerSpacing: number,
  nodeWidth: number = 172,
  nodeHeight: number = 36,
  layoutHidden: boolean = false,
  noParentKey: string = 'no-parent' // New parameter with default for backward compatibility
) => {
  
  /**
   * Apply layout to nodes and edges
   */
  const calculateLayout = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    selectedNodes?: Node[],
    signal?: AbortSignal
  ): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    // Get the appropriate layout engine from engines
    const engine = layoutEngines[algorithm] || layoutEngines.dagre;
    if (!engine) {
      console.error(`Layout engine "${algorithm}" not found`);
      return { nodes, edges };
    }
    
    // Filter out hidden nodes if layoutHidden is false
    const filteredNodes = layoutHidden 
      ? nodes 
      : nodes.filter(node => !node.hidden);
    
    // Filter edges to only include connections between visible nodes
    const visibleNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredEdges = layoutHidden
      ? edges
      : edges.filter(edge => 
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
        );
        
    // Convert direction to format RecursiveLayoutContainerOrganizer expects
    const dagreDirection = convertDirection(direction);
    
    // The margin to use for layout
    const margin = parentResizingOptions.padding.horizontal;
    
    let updatedNodes: Node[] = [];
    let updatedEdges: Edge[] = [];
    
    // Process based on whether we have selected nodes or not
    if (selectedNodes && selectedNodes.length > 0) {
      // Also filter selected nodes if needed
      const filteredSelectedNodes = layoutHidden
        ? selectedNodes
        : selectedNodes.filter(node => !node.hidden);
      
      const result = await processSelectedNodes(
        filteredSelectedNodes,
        {
          dagreDirection,
          nodeParentIdMapWithChildIdSet,
          nodeIdWithNode,
          nodes: filteredNodes,
          edges: filteredEdges,
          margin,
          nodeSpacing,
          layerSpacing,
          nodeWidth,
          nodeHeight,
          layoutHidden,
          noParentKey
        },
        signal
      );
      
      updatedNodes = result.nodes;
      updatedEdges = result.edges;
    } else {
      // Check abort signal before starting tree-based layout
      if (signal?.aborted) {
        return { nodes, edges };
      }

      // Use our helper function to process the entire tree in depth order
      const nodeTree = buildNodeTree(nodeParentIdMapWithChildIdSet, nodeIdWithNode, noParentKey);
      const result = await organizeLayoutByTreeDepth(
        nodeTree,
        dagreDirection,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        filteredEdges,
        margin,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        undefined,
        layoutHidden,
        noParentKey
      );

      updatedNodes = result.updatedNodes;
      updatedEdges = result.updatedEdges;
    }

    // Merge the updated nodes with the original nodes that were filtered out (hidden nodes)
    const finalNodes = nodes.map(node => {
      if (!layoutHidden && node.hidden) {
        return node; // Keep hidden nodes as they are
      }
      const updatedNode = updatedNodes.find(n => n.id === node.id);
      return updatedNode || node;
    });

    return {
      nodes: finalNodes,
      edges: updatedEdges
    };
  }, [
    algorithm, 
    direction, 
    layoutEngines,
    parentResizingOptions.padding.horizontal,
    nodeParentIdMapWithChildIdSet,
    nodeIdWithNode,
    nodeSpacing,
    layerSpacing,
    nodeWidth,
    nodeHeight,
    layoutHidden,
    noParentKey
  ]);

  /**
   * Apply layout to a container and all of its nested sub-containers,
   * without propagating changes up the parent hierarchy.
   * Processes the subtree bottom-up (deepest containers first) so that
   * each parent container sees the correct dimensions of its children.
   */
  const calculateContainerLayout = useCallback(async (
    containerId: string,
    nodes: Node[],
    edges: Edge[],
    signal?: AbortSignal
  ): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    if (signal?.aborted) return { nodes, edges };

    const dagreDirection = convertDirection(direction);
    const margin = parentResizingOptions.padding.horizontal;

    const filteredNodes = layoutHidden ? nodes : nodes.filter(n => !n.hidden);
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = layoutHidden
      ? edges
      : edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

    const temporaryEdgesByParent = createGlobalTemporaryEdgesMap(filteredEdges, nodeIdWithNode, noParentKey);

    // Collect all containers in the subtree deepest-first so each parent
    // container sees correct child dimensions before being laid out itself.
    const getContainersBottomUp = (id: string): string[] => {
      const result: string[] = [];
      const children = nodeParentIdMapWithChildIdSet.get(id);
      if (children) {
        for (const childId of children) {
          if (nodeParentIdMapWithChildIdSet.has(childId)) {
            result.push(...getContainersBottomUp(childId));
          }
        }
      }
      result.push(id);
      return result;
    };

    const containerOrder = getContainersBottomUp(containerId);
    const allUpdatedNodeMap = new Map<string, Node>();

    for (const cId of containerOrder) {
      if (signal?.aborted) return { nodes, edges };

      const { updatedNodes, udpatedParentNode } = await layoutSingleContainer(
        cId,
        dagreDirection,
        nodeParentIdMapWithChildIdSet,
        nodeIdWithNode,
        filteredEdges,
        margin,
        nodeSpacing,
        layerSpacing,
        nodeWidth,
        nodeHeight,
        undefined,
        layoutHidden,
        temporaryEdgesByParent,
        noParentKey
      );

      updatedNodes.forEach(n => allUpdatedNodeMap.set(n.id, n));
      // Spread to create a new reference — fixParentNodeDimensions mutates in place,
      // so without this React Flow would receive the same object reference and skip the re-render.
      if (udpatedParentNode) allUpdatedNodeMap.set(udpatedParentNode.id, { ...udpatedParentNode });
    }

    const finalNodes = nodes.map(n => allUpdatedNodeMap.get(n.id) ?? n);
    return { nodes: finalNodes, edges };
  }, [
    direction,
    parentResizingOptions.padding.horizontal,
    nodeParentIdMapWithChildIdSet,
    nodeIdWithNode,
    nodeSpacing,
    layerSpacing,
    nodeWidth,
    nodeHeight,
    layoutHidden,
    noParentKey,
  ]);

  return { calculateLayout, calculateContainerLayout };
};