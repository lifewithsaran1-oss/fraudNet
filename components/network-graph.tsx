'use client';

import {
  Background,
  BaseEdge,
  Controls,
  getBezierPath,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Dataset, NetworkTrace, RiskAssessment } from '@/types';

type TrailEdgeData = { selected: boolean; elevated: boolean };

function MovingTrailEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
}: EdgeProps<Edge<TrailEdgeData>>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const selected = data?.selected ?? false;
  const elevated = data?.elevated ?? false;
  const stroke = selected ? '#b9c8d8' : elevated ? '#8b4652' : '#24546b';
  const pathId = `trail-${id}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: selected ? 2.25 : elevated ? 1.5 : 1.1,
        }}
      />
      {selected && (
        <path d="M -6 -4 L 6 0 L -6 4 Z" fill="#dce8f3">
          <animateMotion dur="1.9s" repeatCount="indefinite" rotate="auto">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </path>
      )}
      {selected && <path id={pathId} d={edgePath} fill="none" stroke="transparent" />}
    </>
  );
}

const edgeTypes = { trail: MovingTrailEdge };

export function NetworkGraph({
  dataset,
  assessments,
  trace,
  selectedId,
}: {
  dataset: Dataset;
  assessments: Map<string, RiskAssessment>;
  trace?: NetworkTrace;
  selectedId?: string;
}) {
  const transactions = trace
    ? dataset.transactions.filter((transaction) => trace.transactionIds.includes(transaction.id))
    : dataset.transactions
        .filter((transaction) => (assessments.get(transaction.id)?.score ?? 0) >= 50)
        .sort(
          (a, b) =>
            (assessments.get(b.id)?.score ?? 0) -
            (assessments.get(a.id)?.score ?? 0),
        )
        .slice(0, 12);
  const selectedTransaction = transactions.find((transaction) => transaction.id === selectedId);
  const focusedAccountIds = new Set(
    selectedTransaction
      ? [selectedTransaction.senderId, selectedTransaction.recipientId]
      : [],
  );
  const accountIds = [...new Set(transactions.flatMap((transaction) => [transaction.senderId, transaction.recipientId]))];
  const outgoing = new Set(transactions.map((transaction) => transaction.senderId));
  const incoming = new Set(transactions.map((transaction) => transaction.recipientId));
  const columns = new Map<number, string[]>();

  for (const accountId of accountIds) {
    const column = outgoing.has(accountId) && incoming.has(accountId)
      ? 1
      : outgoing.has(accountId)
        ? 0
        : 2;
    columns.set(column, [...(columns.get(column) ?? []), accountId]);
  }

  const nodes: Node[] = accountIds.map((accountId) => {
    const account = dataset.accounts.find((item) => item.id === accountId)!;
    const column = outgoing.has(accountId) && incoming.has(accountId)
      ? 1
      : outgoing.has(accountId)
        ? 0
        : 2;
    const row = (columns.get(column) ?? []).indexOf(accountId);
    const elevated = transactions.some(
      (transaction) =>
        (transaction.senderId === accountId || transaction.recipientId === accountId) &&
        (assessments.get(transaction.id)?.score ?? 0) >= 50,
    );
    const focused = focusedAccountIds.has(accountId);
    const role = focused
      ? accountId === selectedTransaction?.senderId
        ? 'ORIGIN'
        : 'FLAGGED TRANSFER'
      : column === 1
        ? 'PASS-THROUGH'
        : column === 2
          ? 'DESTINATION'
          : 'SOURCE';

    return {
      id: accountId,
      position: { x: 55 + column * 275, y: 55 + row * 118 },
      data: { label: `${role}\n${account.name}` },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        color: focused ? '#0b1220' : '#e2e8f0',
        background: focused ? '#f5f5f7' : elevated ? '#21131a' : '#0d1d2d',
        border: `1px solid ${focused ? '#35d7f2' : elevated ? '#63313c' : '#23435b'}`,
        borderRadius: 14,
        boxShadow: focused ? '0 10px 30px rgba(53, 215, 242, .16)' : 'none',
        fontSize: 11,
        fontWeight: 650,
        lineHeight: 1.7,
        letterSpacing: '.01em',
        padding: '12px 14px',
        whiteSpace: 'pre-line',
        width: 185,
        textAlign: 'center',
      },
    };
  });

  const edges: Edge<TrailEdgeData>[] = transactions.map((transaction) => ({
    id: transaction.id,
    type: 'trail',
    source: transaction.senderId,
    target: transaction.recipientId,
    data: {
      selected: transaction.id === selectedId,
      elevated: (assessments.get(transaction.id)?.score ?? 0) >= 50,
    },
  }));

  if (!transactions.length) {
    return <div className="grid h-full place-items-center text-slate-400">No transfers available</div>;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.35}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#153046" gap={30} size={1} />
      <Controls className="!border-slate-700 !bg-slate-900 !text-white" />
    </ReactFlow>
  );
}