import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from '@xyflow/react';

export const CustomCryptoEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationship = (data?.relationship as string) || 'COMMUNICATES_WITH';
  const isBlocked = Boolean(data?.is_blocked || relationship === 'BLOCKED_BY');
  const label = (data?.label as string) || relationship;

  let strokeColor = '#30363d'; // High-density grid connector
  let strokeDasharray = 'none';
  let badgeColor = 'bg-[#161b22] border-[#30363d] text-[#8b949e] font-mono';

  if (isBlocked) {
    strokeColor = '#da3633'; // Red
    strokeDasharray = '4 4';
    badgeColor = 'bg-[#381014] border-[#da3633] text-[#ff7b72] font-bold font-mono';
  } else if (relationship === 'USES_ALGORITHM') {
    strokeColor = '#388bfd'; // Blue
    badgeColor = 'bg-[#0d1117] border-blue-900/60 text-cyan-300 font-mono';
  } else if (relationship === 'DEPENDS_ON') {
    strokeColor = '#58a6ff'; // Sky
    badgeColor = 'bg-[#0d1117] border-[#21262d] text-[#c9d1d9] font-mono';
  } else if (relationship === 'REPLACED_BY') {
    strokeColor = '#238636'; // Emerald
    badgeColor = 'bg-[#0d2d1a] border-[#238636] text-[#7ee787] font-mono';
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: isBlocked ? 2 : 1.5,
          strokeDasharray,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            className={`px-1.5 py-0.2 text-[8.5px] rounded border shadow-sm backdrop-blur-md flex items-center gap-1 select-none transition-all ${badgeColor}`}
            title={`Relationship: ${relationship}`}
          >
            {isBlocked && <span className="w-1.5 h-1.5 rounded-full bg-[#f85149] animate-ping" />}
            <span>{label}</span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomCryptoEdge.displayName = 'CustomCryptoEdge';
