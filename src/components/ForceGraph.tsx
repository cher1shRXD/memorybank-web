'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge } from '@/types/graph';

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

interface D3Node extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Edge {
  source: D3Node | string;
  target: D3Node | string;
  type: string;
}

export default function ForceGraph({
  nodes,
  edges,
  width = 800,
  height = 600,
  onNodeClick,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Setup SVG
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    // Create container for zoom
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Prepare data
    const d3Nodes: D3Node[] = nodes.map(d => ({ ...d }));
    const d3Edges: D3Edge[] = edges.map(d => ({ 
      source: d.source,
      target: d.target,
      type: d.type 
    }));

    // Create force simulation
    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Edge>(d3Edges)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create edges
    const link = container.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll<SVGLineElement, D3Edge>('line')
      .data(d3Edges)
      .join('line')
      .attr('stroke-width', 2);

    // Create edge labels
    const linkLabel = container.append('g')
      .selectAll<SVGTextElement, D3Edge>('text')
      .data(d3Edges)
      .join('text')
      .attr('font-size', 10)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.type);

    // Create nodes
    const node = container.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(d3Nodes)
      .join('circle')
      .attr('r', d => d.type === 'Concept' ? 20 : 15)
      .attr('fill', d => d.type === 'Concept' ? '#6366f1' : '#10b981')
      .style('cursor', 'pointer');

    // Create node labels
    const nodeLabel = container.append('g')
      .selectAll('text')
      .data(d3Nodes)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 12)
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name);

    // Add tooltips
    node.append('title')
      .text(d => `${d.type}: ${d.name}`);

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Add click handler
    node.on('click', (event, d) => {
      if (onNodeClick) {
        onNodeClick(d);
      }
    });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      linkLabel
        .attr('x', d => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr('y', d => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      nodeLabel
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, onNodeClick]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ cursor: 'grab' }}
    />
  );
}