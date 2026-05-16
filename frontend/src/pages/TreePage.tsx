import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api, type TreeNode } from '../api/client';

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  level: number;
}

const NODE_W = 160;
const NODE_H = 72;
const H_GAP = 40;
const V_GAP = 100;

export default function TreePage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    api.getTree()
      .then((data) => setNodes(data.nodes))
      .finally(() => setLoading(false));
  }, []);

  const layoutTree = useCallback(() => {
    if (!nodes.length) return { layoutNodes: [], links: [] };

    const nodeMap = new Map<number, TreeNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const roots = nodes.filter(
      (n) => !n.father_id && !n.mother_id
    );

    if (roots.length === 0 && nodes.length > 0) {
      roots.push(nodes[0]);
    }

    const layoutNodes: LayoutNode[] = [];
    const links: { source: LayoutNode; target: LayoutNode }[] = [];
    const positioned = new Set<number>();

    const levelOffsets: Map<number, number> = new Map();

    function getNextX(level: number): number {
      const current = levelOffsets.get(level) || 0;
      return current;
    }

    function setNextX(level: number, x: number) {
      levelOffsets.set(level, x);
    }

    function layoutSubtree(nodeId: number, level: number): LayoutNode | null {
      if (positioned.has(nodeId)) {
        return layoutNodes.find((ln) => ln.node.id === nodeId) || null;
      }
      positioned.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) return null;

      const childIds = node.children_ids.filter((cid) => !positioned.has(cid));

      if (childIds.length === 0) {
        const x = getNextX(level);
        const ln: LayoutNode = { node, x, y: level * (NODE_H + V_GAP), level };
        layoutNodes.push(ln);
        setNextX(level, x + NODE_W + H_GAP);
        return ln;
      }

      const childLayouts: LayoutNode[] = [];
      for (const cid of childIds) {
        const cl = layoutSubtree(cid, level + 1);
        if (cl) childLayouts.push(cl);
      }

      let x: number;
      if (childLayouts.length > 0) {
        const minX = Math.min(...childLayouts.map((c) => c.x));
        const maxX = Math.max(...childLayouts.map((c) => c.x));
        x = (minX + maxX) / 2;
      } else {
        x = getNextX(level);
      }

      const currentMinX = getNextX(level);
      if (x < currentMinX) x = currentMinX;

      const ln: LayoutNode = { node, x, y: level * (NODE_H + V_GAP), level };
      layoutNodes.push(ln);
      setNextX(level, x + NODE_W + H_GAP);

      for (const cl of childLayouts) {
        links.push({ source: ln, target: cl });
      }

      return ln;
    }

    for (const root of roots) {
      layoutSubtree(root.id, 0);
    }

    for (const n of nodes) {
      if (!positioned.has(n.id)) {
        layoutSubtree(n.id, 0);
      }
    }

    // Also add parent-child links from the data that might have been missed
    for (const ln of layoutNodes) {
      const node = ln.node;
      if (node.father_id) {
        const fatherLn = layoutNodes.find((l) => l.node.id === node.father_id);
        if (fatherLn && !links.some((l) => l.source === fatherLn && l.target === ln)) {
          links.push({ source: fatherLn, target: ln });
        }
      }
      if (node.mother_id) {
        const motherLn = layoutNodes.find((l) => l.node.id === node.mother_id);
        if (motherLn && !links.some((l) => l.source === motherLn && l.target === ln)) {
          links.push({ source: motherLn, target: ln });
        }
      }
    }

    return { layoutNodes, links };
  }, [nodes]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !nodes.length) return;

    const { layoutNodes, links } = layoutTree();
    if (!layoutNodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const maxX = Math.max(...layoutNodes.map((n) => n.x)) + NODE_W + 100;
    const maxY = Math.max(...layoutNodes.map((n) => n.y)) + NODE_H + 100;

    svg.attr('viewBox', `${-50} ${-50} ${maxX + 100} ${maxY + 100}`);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    // Draw links with curved paths
    const linkGroup = g.append('g').attr('class', 'links');
    links.forEach(({ source, target }) => {
      const sx = source.x + NODE_W / 2;
      const sy = source.y + NODE_H;
      const tx = target.x + NODE_W / 2;
      const ty = target.y;
      const midY = (sy + ty) / 2;

      linkGroup.append('path')
        .attr('d', `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`)
        .attr('fill', 'none')
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2)
        .attr('opacity', 0.6);
    });

    // Draw spouse connectors
    for (const ln of layoutNodes) {
      if (ln.node.spouse_id) {
        const spouseLn = layoutNodes.find((l) => l.node.id === ln.node.spouse_id);
        if (spouseLn && ln.node.id < ln.node.spouse_id!) {
          const x1 = ln.x + NODE_W;
          const x2 = spouseLn.x;
          const y = ln.y + NODE_H / 2;
          linkGroup.append('line')
            .attr('x1', x1)
            .attr('y1', y)
            .attr('x2', x2)
            .attr('y2', spouseLn.y + NODE_H / 2)
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '6,3')
            .attr('opacity', 0.8);

          // Heart icon midpoint
          const midX = (x1 + x2) / 2;
          const midYConn = (y + spouseLn.y + NODE_H / 2) / 2;
          linkGroup.append('text')
            .attr('x', midX)
            .attr('y', midYConn)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '14')
            .text('💛');
        }
      }
    }

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    layoutNodes.forEach((ln) => {
      const nodeG = nodeGroup.append('g')
        .attr('transform', `translate(${ln.x}, ${ln.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => setSelectedNode(ln.node));

      // Shadow
      nodeG.append('rect')
        .attr('x', 2)
        .attr('y', 2)
        .attr('width', NODE_W)
        .attr('height', NODE_H)
        .attr('rx', 12)
        .attr('fill', 'rgba(0,0,0,0.08)');

      // Card background
      const color = ln.node.gender === 'male' ? '#3b82f6' : ln.node.gender === 'female' ? '#ec4899' : '#8b5cf6';
      nodeG.append('rect')
        .attr('width', NODE_W)
        .attr('height', NODE_H)
        .attr('rx', 12)
        .attr('fill', 'white')
        .attr('stroke', color)
        .attr('stroke-width', 2);

      // Gender indicator bar
      nodeG.append('rect')
        .attr('width', NODE_W)
        .attr('height', 4)
        .attr('rx', 2)
        .attr('fill', color);

      // Avatar circle
      const avatarSize = 36;
      nodeG.append('circle')
        .attr('cx', 28)
        .attr('cy', NODE_H / 2 + 4)
        .attr('r', avatarSize / 2)
        .attr('fill', color)
        .attr('opacity', 0.15);

      nodeG.append('text')
        .attr('x', 28)
        .attr('y', NODE_H / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '14')
        .attr('font-weight', 'bold')
        .attr('fill', color)
        .text(`${ln.node.first_name[0]}${ln.node.last_name[0]}`);

      // Name
      nodeG.append('text')
        .attr('x', 54)
        .attr('y', NODE_H / 2 - 2)
        .attr('font-size', '12')
        .attr('font-weight', 'bold')
        .attr('fill', '#1e293b')
        .text(ln.node.first_name);

      nodeG.append('text')
        .attr('x', 54)
        .attr('y', NODE_H / 2 + 14)
        .attr('font-size', '11')
        .attr('fill', '#64748b')
        .text(ln.node.last_name);

      // Hover effect
      nodeG.on('mouseenter', function () {
        d3.select(this).select('rect:nth-child(2)')
          .transition()
          .duration(200)
          .attr('stroke-width', 3)
          .attr('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))');
      });
      nodeG.on('mouseleave', function () {
        d3.select(this).select('rect:nth-child(2)')
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .attr('filter', 'none');
      });
    });

    // Center the tree
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const scale = Math.min(containerWidth / (maxX + 100), containerHeight / (maxY + 100), 1);
    const translateX = (containerWidth - (maxX + 100) * scale) / 2;
    const translateY = 20;
    svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
  }, [nodes, layoutTree]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your family tree...</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Tree is Empty</h2>
          <p className="text-gray-500 mb-6">Start by adding family members to see your tree grow!</p>
          <a
            href="/members"
            className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-xl font-semibold no-underline hover:shadow-lg transition-all inline-block"
          >
            Add Your First Member
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Family Tree</h1>
          <p className="text-gray-500 text-sm">Click on any member to see details. Scroll to zoom, drag to pan.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Male
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-pink-500 inline-block" /> Female
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Other
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            --- Spouse
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Member Detail Panel */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNode(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-6 text-white ${
                selectedNode.gender === 'male'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                  : selectedNode.gender === 'female'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedNode.first_name[0]}{selectedNode.last_name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold m-0">{selectedNode.first_name} {selectedNode.last_name}</h2>
                  <p className="text-white/80 capitalize">{selectedNode.gender}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {selectedNode.birth_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Born</span>
                  <span className="font-medium">{selectedNode.birth_date}</span>
                </div>
              )}
              {selectedNode.death_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Died</span>
                  <span className="font-medium">{selectedNode.death_date}</span>
                </div>
              )}
              {selectedNode.father_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Father</span>
                  <span className="font-medium">
                    {nodes.find((n) => n.id === selectedNode.father_id)?.first_name || 'Unknown'}{' '}
                    {nodes.find((n) => n.id === selectedNode.father_id)?.last_name || ''}
                  </span>
                </div>
              )}
              {selectedNode.mother_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Mother</span>
                  <span className="font-medium">
                    {nodes.find((n) => n.id === selectedNode.mother_id)?.first_name || 'Unknown'}{' '}
                    {nodes.find((n) => n.id === selectedNode.mother_id)?.last_name || ''}
                  </span>
                </div>
              )}
              {selectedNode.spouse_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Spouse</span>
                  <span className="font-medium">
                    {nodes.find((n) => n.id === selectedNode.spouse_id)?.first_name || 'Unknown'}{' '}
                    {nodes.find((n) => n.id === selectedNode.spouse_id)?.last_name || ''}
                  </span>
                </div>
              )}
              {selectedNode.children_ids.length > 0 && (
                <div>
                  <span className="text-gray-500">Children</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedNode.children_ids.map((cid) => {
                      const child = nodes.find((n) => n.id === cid);
                      return child ? (
                        <span
                          key={cid}
                          className="bg-gray-100 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-gray-200"
                          onClick={() => setSelectedNode(child)}
                        >
                          {child.first_name} {child.last_name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full mt-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
