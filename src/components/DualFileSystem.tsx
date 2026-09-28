import React, { useState } from 'react';
import {
  Folder,
  File,
  HardDrive,
  Gamepad2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Move,
  Link,
  Archive,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { FileSystemItem, UniversalContextObject } from '../types';
import { cachyState } from '../services/cachyState';

interface DualFileSystemProps {
  onOpenContextCard: (obj: UniversalContextObject) => void;
  onPrepareCommand: (cmdString: string) => void;
}

export const DualFileSystem: React.FC<DualFileSystemProps> = ({
  onOpenContextCard,
  onPrepareCommand
}) => {
  // Panel A & Panel B paths
  const [pathA, setPathA] = useState('/run/media/cachy/GamesSSD');
  const [pathB, setPathB] = useState('/home/cachy/Documents/My Games');

  const [selectedIdsA, setSelectedIdsA] = useState<string[]>([]);
  const [selectedIdsB, setSelectedIdsB] = useState<string[]>([]);

  const [filterA, setFilterA] = useState('');
  const [filterB, setFilterB] = useState('');

  // Transfer Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDirection, setTransferDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [transferOperation, setTransferOperation] = useState<'copy' | 'move' | 'symlink' | 'archive'>('copy');
  const [conflictPolicy, setConflictPolicy] = useState<'replace' | 'skip' | 'keep_both'>('replace');

  // Quick Bookmarks
  const bookmarks = [
    { label: 'Games SSD', path: '/run/media/cachy/GamesSSD' },
    { label: 'My Games (Saves)', path: '/home/cachy/Documents/My Games' },
    { label: 'Home Games', path: '/home/cachy/Games' },
    { label: 'Home (~)', path: '/home/cachy' },
    { label: 'Block Devices', path: '/dev' }
  ];

  const itemsA = cachyState.listDirectory(pathA).filter((item) =>
    item.name.toLowerCase().includes(filterA.toLowerCase())
  );
  const itemsB = cachyState.listDirectory(pathB).filter((item) =>
    item.name.toLowerCase().includes(filterB.toLowerCase())
  );

  const toggleSelectA = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIdsA((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIdsA([id]);
    }
  };

  const toggleSelectB = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIdsB((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIdsB([id]);
    }
  };

  const handleOpenItem = (item: FileSystemItem, panel: 'A' | 'B') => {
    if (item.type === 'directory' || item.type === 'steam_lib' || item.type === 'wine_prefix') {
      if (panel === 'A') {
        setPathA(item.path);
        setSelectedIdsA([]);
      } else {
        setPathB(item.path);
        setSelectedIdsB([]);
      }
    } else {
      // Open Context Card
      const ctx = cachyState.resolveContextObject(item.path);
      onOpenContextCard(ctx);
    }
  };

  const handleNavigateUp = (panel: 'A' | 'B') => {
    const currentPath = panel === 'A' ? pathA : pathB;
    if (currentPath === '/' || currentPath === '') return;
    const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    if (panel === 'A') {
      setPathA(parent);
      setSelectedIdsA([]);
    } else {
      setPathB(parent);
      setSelectedIdsB([]);
    }
  };

  const handleStartTransfer = (direction: 'AtoB' | 'BtoA') => {
    setTransferDirection(direction);
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = () => {
    const sources =
      transferDirection === 'AtoB'
        ? itemsA.filter((i) => selectedIdsA.includes(i.id))
        : itemsB.filter((i) => selectedIdsB.includes(i.id));

    const targetDir = transferDirection === 'AtoB' ? pathB : pathA;

    if (transferOperation === 'copy') {
      cachyState.transferItems(sources, targetDir, 'copy');
      onPrepareCommand(`rsync -avh --progress ${sources.map((s) => `"${s.path}"`).join(' ')} "${targetDir}/"`);
    } else if (transferOperation === 'move') {
      cachyState.transferItems(sources, targetDir, 'move');
      onPrepareCommand(`mv -v ${sources.map((s) => `"${s.path}"`).join(' ')} "${targetDir}/"`);
    } else if (transferOperation === 'symlink') {
      cachyState.transferItems(sources, targetDir, 'symlink');
      onPrepareCommand(`ln -sv ${sources.map((s) => `"${s.path}"`).join(' ')} "${targetDir}/"`);
    } else if (transferOperation === 'archive') {
      onPrepareCommand(`tar -cvaf "${targetDir}/games_backup_${Date.now()}.tar.zst" ${sources.map((s) => `"${s.path}"`).join(' ')}`);
    }

    setShowTransferModal(false);
    setSelectedIdsA([]);
    setSelectedIdsB([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-[#070a12]">
      {/* Bookmarks Bar */}
      <div className="px-4 py-2 bg-[#090e1a] border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-slate-400 font-mono text-[11px] shrink-0">Bookmarks:</span>
          {bookmarks.map((bm) => (
            <button
              key={bm.path}
              onClick={() => setPathA(bm.path)}
              className="px-2.5 py-1 rounded bg-[#0d1424] hover:bg-[#142038] text-slate-300 hover:text-[#00d4ff] border border-slate-800/80 font-mono text-[11px] whitespace-nowrap transition-colors"
            >
              {bm.label}
            </button>
          ))}
        </div>
        <div className="text-slate-400 text-[11px] hidden sm:block">
          Dual-Panel Drag & Transfer Workspace
        </div>
      </div>

      {/* Main Dual Panels */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
        {/* PANEL A */}
        <div className="flex flex-col h-full bg-[#0a0f1d] overflow-hidden">
          {/* Path Header A */}
          <div className="p-3 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <button
                onClick={() => handleNavigateUp('A')}
                disabled={pathA === '/'}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs"
                title="Go to parent directory"
              >
                Up
              </button>
              <div className="font-mono text-xs text-[#00d4ff] bg-black/40 px-2.5 py-1 rounded border border-slate-800/80 truncate flex-1">
                {pathA}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={filterA}
                onChange={(e) => setFilterA(e.target.value)}
                placeholder="Filter..."
                className="w-24 text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Item List A */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {itemsA.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Directory is empty or no matching files.
              </div>
            ) : (
              itemsA.map((item) => {
                const isSelected = selectedIdsA.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={(e) => toggleSelectA(item.id, e.ctrlKey || e.metaKey)}
                    onDoubleClick={() => handleOpenItem(item, 'A')}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#00d4ff]/20 border border-[#00d4ff]/40 text-white'
                        : 'hover:bg-[#121c33] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#00d4ff] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      {item.type === 'win_exe' ? (
                        <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : item.type === 'directory' || item.type === 'steam_lib' ? (
                        <Folder className="w-4 h-4 text-[#00d4ff] shrink-0" />
                      ) : item.type === 'device' ? (
                        <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-mono truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                      <span>{item.displaySize || item.permissions}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const ctx = cachyState.resolveContextObject(item.path);
                          onOpenContextCard(ctx);
                        }}
                        className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded"
                        title="Open Context Card"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel A Footer Action */}
          <div className="p-2.5 bg-[#090e1a] border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              {selectedIdsA.length} selected of {itemsA.length} items
            </span>
            <button
              disabled={selectedIdsA.length === 0}
              onClick={() => handleStartTransfer('AtoB')}
              className="px-3 py-1.5 rounded bg-[#00d4ff] hover:bg-[#00d4ff]/90 disabled:opacity-30 text-slate-950 font-bold transition-colors flex items-center gap-1.5"
            >
              Transfer to Panel B <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PANEL B */}
        <div className="flex flex-col h-full bg-[#0a0f1d] overflow-hidden">
          {/* Path Header B */}
          <div className="p-3 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <button
                onClick={() => handleNavigateUp('B')}
                disabled={pathB === '/'}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs"
                title="Go to parent directory"
              >
                Up
              </button>
              <div className="font-mono text-xs text-emerald-400 bg-black/40 px-2.5 py-1 rounded border border-slate-800/80 truncate flex-1">
                {pathB}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={filterB}
                onChange={(e) => setFilterB(e.target.value)}
                placeholder="Filter..."
                className="w-24 text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Item List B */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {itemsB.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Directory is empty or no matching files.
              </div>
            ) : (
              itemsB.map((item) => {
                const isSelected = selectedIdsB.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={(e) => toggleSelectB(item.id, e.ctrlKey || e.metaKey)}
                    onDoubleClick={() => handleOpenItem(item, 'B')}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                        : 'hover:bg-[#121c33] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      {item.type === 'win_exe' ? (
                        <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : item.type === 'directory' || item.type === 'steam_lib' ? (
                        <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-mono truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                      <span>{item.displaySize || item.permissions}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const ctx = cachyState.resolveContextObject(item.path);
                          onOpenContextCard(ctx);
                        }}
                        className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded"
                        title="Open Context Card"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel B Footer Action */}
          <div className="p-2.5 bg-[#090e1a] border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              disabled={selectedIdsB.length === 0}
              onClick={() => handleStartTransfer('BtoA')}
              className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Transfer to Panel A
            </button>
            <span className="text-slate-400 font-mono text-[11px]">
              {selectedIdsB.length} selected of {itemsB.length} items
            </span>
          </div>
        </div>
      </div>

      {/* Transfer Intent & Conflict Resolution Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c1222] border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Move className="w-4 h-4 text-[#00d4ff]" />
              Select File Transfer Operation Intent
            </h3>

            <div className="text-xs text-slate-300">
              Moving from:{' '}
              <span className="font-mono text-[#00d4ff]">
                {transferDirection === 'AtoB' ? pathA : pathB}
              </span>
              <br />
              Target destination:{' '}
              <span className="font-mono text-emerald-400">
                {transferDirection === 'AtoB' ? pathB : pathA}
              </span>
            </div>

            {/* Operation Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Operation:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTransferOperation('copy')}
                  className={`p-2 rounded border text-left flex items-center gap-2 ${
                    transferOperation === 'copy'
                      ? 'bg-[#00d4ff]/20 border-[#00d4ff] text-white'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5 text-[#00d4ff]" />
                  <span>Copy (rsync -avP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferOperation('move')}
                  className={`p-2 rounded border text-left flex items-center gap-2 ${
                    transferOperation === 'move'
                      ? 'bg-[#00d4ff]/20 border-[#00d4ff] text-white'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <Move className="w-3.5 h-3.5 text-amber-400" />
                  <span>Move (mv -v)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferOperation('symlink')}
                  className={`p-2 rounded border text-left flex items-center gap-2 ${
                    transferOperation === 'symlink'
                      ? 'bg-[#00d4ff]/20 border-[#00d4ff] text-white'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <Link className="w-3.5 h-3.5 text-purple-400" />
                  <span>Create Symlink (ln -s)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferOperation('archive')}
                  className={`p-2 rounded border text-left flex items-center gap-2 ${
                    transferOperation === 'archive'
                      ? 'bg-[#00d4ff]/20 border-[#00d4ff] text-white'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Archive (tar.zst)</span>
                </button>
              </div>
            </div>

            {/* Conflict Policy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Conflict Handling:</label>
              <div className="flex gap-2 text-xs">
                {(['replace', 'skip', 'keep_both'] as const).map((pol) => (
                  <button
                    key={pol}
                    type="button"
                    onClick={() => setConflictPolicy(pol)}
                    className={`flex-1 py-1.5 px-2 rounded border capitalize text-center ${
                      conflictPolicy === pol
                        ? 'bg-slate-800 border-[#00d4ff] text-white font-semibold'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    {pol.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="px-4 py-1.5 rounded bg-[#00d4ff] text-slate-950 font-bold text-xs hover:bg-[#00d4ff]/90 transition-colors"
              >
                Execute Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
