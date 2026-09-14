'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, Network, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InvestigationPanel } from './investigation-panel';
import { NetworkGraph } from './network-graph';
import { RiskBadge } from './risk-badge';
import { useFraudData } from '@/hooks/use-fraud-data';
import { simulateIntervention, traceTransaction } from '@/lib/network';
import type { NetworkTrace } from '@/types';

const money = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  });

type Screen = 'welcome' | 'dashboard';

export function FraudNetDashboard() {
  const {
    dataset,
    assessments,
    strongest,
    error,
  } = useFraudData();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [selectedId, setFocusId] = useState(strongest?.id ?? '');
  const [trace, setTrace] = useState<NetworkTrace>();
  const [interventionOpen, setInterventionOpen] = useState(false);
  useEffect(() => {
    if (strongest && !dataset.transactions.some((transaction) => transaction.id === selectedId)) {
      setFocusId(strongest.id);
    }
  }, [dataset.transactions, selectedId, strongest]);
  const selected =
    dataset.transactions.find((transaction) => transaction.id === selectedId) ??
    strongest;
  const reviewCases = useMemo(
    () =>
      dataset.transactions
        .filter((transaction) => (assessments.get(transaction.id)?.score ?? 0) >= 50)
        .sort(
          (a, b) =>
            (assessments.get(b.id)?.score ?? 0) -
            (assessments.get(a.id)?.score ?? 0),
        )
        .slice(0, 8),
    [dataset, assessments],
  );
  const focusCase = (transactionId: string) => {
    setFocusId(transactionId);
    setTrace(traceTransaction(dataset, assessments, transactionId, 2));
  };
  const runTrace = () => {
    if (selected) setTrace(traceTransaction(dataset, assessments, selected.id, 2));
  };
  const intervention =
    selected && trace
      ? simulateIntervention(dataset, assessments, trace, selected.recipientId)
      : undefined;
  const selectCase = (transactionId: string) => focusCase(transactionId);
  const openDashboard = () => {
    setScreen('dashboard');
  };

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07101c] p-6 text-slate-100">
        <div className="max-w-md rounded-xl border border-[#ff5c55]/50 bg-[#ff5c55]/10 p-6 text-center">
          <ShieldAlert className="mx-auto text-[#ff6b63]" />
          <h1 className="mt-3 text-xl font-semibold">FraudNet could not start</h1>
          <p className="mt-2 text-slate-300">{error}</p>
        </div>
      </main>
    );
  }

  if (screen === 'welcome') {
    return (
      <main className="min-h-screen bg-[#07101c] text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 sm:px-10">
          <header className="flex items-center justify-between">
            {/* oxlint-disable-next-line next/no-img-element -- local brand asset avoids a Vinext next/image runtime incompatibility */}
            <img
              src="/logo-header.png"
              alt="FraudNet"
              width="160"
              height="50"
              className="h-10 w-[128px] object-contain object-left"
            />
            <span className="rounded-full border border-[#35d7f2]/30 bg-[#35d7f2]/10 px-3 py-1 text-xs font-semibold text-[#62e6f8]">
              SYNTHETIC DEMO
            </span>
          </header>

          <section className="my-auto py-16 sm:py-24">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-[#62e6f8]">
              Fraud investigation, made clear
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Follow suspicious money movement without getting lost in the data.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              FraudNet highlights the transfers worth reviewing, explains the risk,
              and lets you trace where funds moved next.
            </p>
            <Button
              size="lg"
              onClick={openDashboard}
              className="mt-8 bg-[#35d7f2] px-6 text-[#031018] hover:bg-[#66e7f8]"
            >
              Open investigation dashboard
              <ArrowRight />
            </Button>
          </section>

          <section className="grid gap-3 border-t border-slate-800 pt-6 md:grid-cols-3">
            {[
              ['1', 'Pick a transfer', 'Start with the highest-priority alert.'],
              ['2', 'Understand the risk', 'See the specific behavior that raised concern.'],
              ['3', 'Trace the route', 'Follow connected accounts in a focused map.'],
            ].map(([step, title, description]) => (
              <div key={step} className="flex gap-3 rounded-lg p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#35d7f2]/15 text-sm font-bold text-[#62e6f8]">
                  {step}
                </span>
                <div>
                  <h2 className="font-medium text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b14] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#07101c]/95 px-4 py-3 backdrop-blur-xl lg:px-7">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* oxlint-disable-next-line next/no-img-element -- local brand asset avoids a Vinext next/image runtime incompatibility */}
            <img
              src="/logo-header.png"
              alt="FraudNet"
              width="160"
              height="50"
              className="h-9 w-[116px] object-contain object-left"
            />
            <span className="hidden text-sm text-slate-500 sm:block">Investigation dashboard</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('welcome')}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ChevronLeft />
            Help
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-7">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#55def5]">
              Current investigation
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              A clearer view of one suspicious transfer.
            </h1>
          </div>
          <p className="text-sm text-slate-500">Select a different case when you are ready.</p>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-white">
                  <Network size={18} className="text-[#62e6f8]" />
                  The money trail
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {trace
                    ? 'Showing the route connected to your selected transfer.'
                    : 'A focused two-step view of the selected transfer and where its funds moved next.'}
                </p>
              </div>
              <div className="flex gap-3 text-xs text-slate-400">
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#ff5c55]" />Risk signal</span>
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-white" />Focus</span>
              </div>
            </div>
            <div className="h-[500px]">
              <NetworkGraph
                dataset={dataset}
                assessments={assessments}
                trace={trace}
                selectedId={selected?.id}
              />
            </div>
          </div>

          <aside className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-semibold text-white">Review list</h2>
              <p className="mt-1 text-sm text-slate-400">Start with the top alert or choose another.</p>
            </div>
            <div className="mt-3 space-y-2">
              {reviewCases.map((transaction) => {
                const sender = dataset.accounts.find((account) => account.id === transaction.senderId);
                const recipient = dataset.accounts.find((account) => account.id === transaction.recipientId);
                const risk = assessments.get(transaction.id)!;
                return (
                  <button
                    key={transaction.id}
                    onClick={() => selectCase(transaction.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${selected?.id === transaction.id ? 'border-[#35d7f2]/60 bg-[#35d7f2]/10' : 'border-slate-800 bg-slate-950/35 hover:border-slate-600'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-white">
                        {sender?.name ?? transaction.senderId}
                      </p>
                      <RiskBadge level={risk.level} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      to {recipient?.name ?? transaction.recipientId}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-200">
                      {money(transaction.amount)} <span className="ml-1 text-xs font-normal text-slate-500">Score {risk.score}/100</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>

        <section id="investigation" className="max-w-4xl scroll-mt-20">
          <InvestigationPanel
            dataset={dataset}
            assessments={assessments}
            transactionId={selected?.id ?? ''}
            trace={trace}
            onTrace={runTrace}
            onSimulate={() => setInterventionOpen(true)}
          />
        </section>
      </div>

      <Dialog open={interventionOpen} onOpenChange={setInterventionOpen}>
        <DialogContent className="border-slate-700 bg-slate-950 text-slate-100">
          <DialogHeader>
            <DialogTitle>Potential response impact</DialogTitle>
            <DialogDescription className="text-slate-400">
              Synthetic projection for blocking {selected?.recipientId} in this traced route.
            </DialogDescription>
          </DialogHeader>
          {intervention && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Transfers affected', intervention.transactionsAffected],
                ['Accounts affected', intervention.accountsAffected],
                ['Value affected', money(intervention.transactionValueAffected)],
                ['Suspicious paths disrupted', intervention.suspiciousPathsDisrupted],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}