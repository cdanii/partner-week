'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Calendar, Clock } from 'lucide-react';
import { initialSchedule, DaySchedule, EventItem } from '@/data/initialSchedule';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import useLongPress from '@/hooks/useLongPress';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const PASSWORD = 'partners2026';

// Component helper for Event Card to permit Hook usage per item
const EventCard = ({
  event,
  dayId,
  onLongPress
}: {
  event: EventItem;
  dayId: string;
  onLongPress: (dayId: string, event: EventItem) => void;
}) => {
  const handlers = useLongPress(
    () => onLongPress(dayId, event),
    () => { }, // Normal click does nothing
    { delay: 600, shouldPreventDefault: true }
  );

  return (
    <div
      {...handlers}
      className={cn(
        "relative p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm transition-all select-none touch-manipulation",
        "active:scale-[0.98] active:bg-slate-50",
        "flex flex-col gap-2"
      )}
    >
      <h4 className="text-base sm:text-lg font-bold text-[#1e293b] leading-tight">
        {event.title}
      </h4>
      {event.description && (
        <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">
          {event.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex items-center text-xs sm:text-sm font-medium text-slate-500 bg-slate-100 rounded-md px-2 py-1">
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          {event.startTime} – {event.endTime}
        </div>
      </div>
    </div>
  );
};

export default function SchedulePage() {
  // State
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Modals
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Inputs
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Editing Tracking
  const [pendingEdit, setPendingEdit] = useState<{ dayId: string; event: EventItem } | null>(null);
  const [editingData, setEditingData] = useState<{ dayId: string; event: EventItem } | null>(null);

  const scheduleRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('partners-schedule-data');
    if (saved) {
      try {
        setSchedule(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse schedule", e);
      }
    }
  }, []);

  // Save to LocalStorage on update
  useEffect(() => {
    localStorage.setItem('partners-schedule-data', JSON.stringify(schedule));
  }, [schedule]);

  const handleLongPress = (dayId: string, event: EventItem) => {
    const target = { dayId, event };
    if (isAuthenticated) {
      setEditingData(target);
      setEditModalOpen(true);
    } else {
      setPendingEdit(target);
      setPasswordModalOpen(true);
    }
  };

  const verifyPassword = () => {
    if (passwordInput === PASSWORD) {
      setIsAuthenticated(true);
      setPasswordModalOpen(false);
      setAuthError(false);
      setPasswordInput('');

      if (pendingEdit) {
        setEditingData(pendingEdit);
        setEditModalOpen(true);
        setPendingEdit(null);
      }
    } else {
      setAuthError(true);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData) return;

    setSchedule(prev => {
      // Create a deep copy to manipulate
      const newSchedule = prev.map(d => ({
        ...d,
        events: d.events.map(ev => ({ ...ev }))
      }));

      // 1. Remove event from original day
      const sourceDayIndex = newSchedule.findIndex(d => d.id === editingData.dayId);
      // Note: editingData.dayId initially holds the source day ID, but if we changed the dropdown,
      // handled below, we might need to track source vs target.
      // Wait, 'editingData' state changes when we edit the form. 
      // So if I change the day in the dropdown, editingData.dayId updates.
      // I need to know where it came *from* to remove it.
      // Strategy: Use ID to find it in the entire schedule first.

      let foundSourceDayId = '';
      let foundEventIndex = -1;

      for (const day of newSchedule) {
        const idx = day.events.findIndex(ev => ev.id === editingData.event.id);
        if (idx !== -1) {
          foundSourceDayId = day.id;
          foundEventIndex = idx;
          break;
        }
      }

      if (foundSourceDayId && foundEventIndex !== -1) {
        // Remove from source
        newSchedule.find(d => d.id === foundSourceDayId)!.events.splice(foundEventIndex, 1);
      }

      // 2. Add to target day (editingData.dayId)
      const targetDay = newSchedule.find(d => d.id === editingData.dayId);
      if (targetDay) {
        targetDay.events.push(editingData.event);
        // Sort events by startTime
        targetDay.events.sort((a, b) => a.startTime.localeCompare(b.startTime));
      }

      return newSchedule;
    });

    setEditModalOpen(false);
    setEditingData(null);
  };

  // State for export mode
  const [isExporting, setIsExporting] = useState(false);

  // Create a ref for the FULL container (header + schedule)
  const fullContentRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!fullContentRef.current) return;

    // 1. Enter Export Mode
    setIsExporting(true);

    // Wait for render update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const { toBlob } = await import('html-to-image');
      const { saveAs } = await import('file-saver');

      const blob = await toBlob(fullContentRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        pixelRatio: 3,
        width: 1200,
        filter: (node) => {
          // Exclude the 'Download' button container based on ID
          if (node.id === 'controls-container') return false;
          return true;
        },
        style: {
          // Force CSS Reset during Capture
          margin: '0',
          padding: '40px',
          height: 'auto',
          maxWidth: 'none',
          width: '1200px',

          // Ensure internal container constraints are removed
          display: 'block',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }
      });

      if (blob) {
        saveAs(blob, 'Prodam-Partners-Week-Cronograma.png');
      } else {
        alert('Erro ao gerar imagem.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao exportar.');
    } finally {
      // 2. Exit Export Mode
      setIsExporting(false);
    }
  }, []);

  return (
    <main
      ref={fullContentRef}
      className={cn(
        "min-h-screen bg-slate-50 font-sans pb-20 transition-all",
        // When exporting, remove centering and constrain width to fit content left-aligned
        isExporting ? "max-w-none mx-0 px-0 items-start justify-start w-[1200px]" : ""
      )}
    >
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-4 py-4",
          // Normal mode: Centered container with padding
          !isExporting && "max-w-5xl mx-auto px-4 sm:px-6 md:px-8",
          // Export mode: Remove max-w and unify padding
          isExporting && "w-full px-10 max-w-none mx-0"
        )}>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#011457] tracking-tight">
              Prodam Partners Week
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">Cronograma de Apresentações</p>
          </div>
          <div id="controls-container" className="w-full sm:w-auto">
            <Button
              onClick={handleExport}
              className="w-full bg-[#011457] hover:bg-[#000d3d] text-white shadow-md active:scale-95 transition-all text-sm py-2.5 h-auto rounded-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Cronograma
            </Button>
          </div>
        </div>
      </header>

      {/* Scrollable Container */}
      <div className={cn(
        "py-8",
        // Normal mode
        !isExporting && "max-w-5xl mx-auto px-4 sm:px-6 md:px-8",
        // Export mode: Remove container constraints
        isExporting && "w-full px-10 max-w-none mx-0"
      )}>
        <div ref={scheduleRef} className="bg-transparent rounded-xl">
          <div className="space-y-6">
            {schedule.map((day) => (
              <div
                key={day.id}
                className="flex flex-col md:flex-row rounded-lg overflow-hidden shadow-sm bg-white border border-slate-200"
              >
                {/* Left Column (Day Info) - Styled with #011457 */}
                <div className="bg-[#011457] text-white p-6 md:w-48 flex flex-row md:flex-col items-center md:items-start md:justify-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-200" />
                    <span className="text-lg font-bold">{day.date}</span>
                  </div>
                  <span className="text-blue-100 font-medium text-sm md:text-lg uppercase tracking-wide">
                    {day.dayName}
                  </span>
                </div>

                {/* Right Column (Events) */}
                <div className="flex-1 p-4 sm:p-5 bg-slate-50/50">
                  <div className="space-y-3">
                    {day.events.length === 0 && (
                      <p className="text-slate-400 text-sm italic py-2">Nenhum evento agendado.</p>
                    )}
                    {day.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        dayId={day.id}
                        onLongPress={handleLongPress}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Footer branding for export */}
          <div className="mt-8 text-center text-slate-400 text-xs py-4 border-t border-slate-200">
            Prodam Partners Week • Schedule
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Modo Edição"
      >
        <div className="space-y-4 pt-2">
          <p className="text-slate-600 text-sm">
            Para editar o cronograma, mantenha pressionado o evento e insira a senha.
          </p>
          <input
            type="password"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-[#011457] focus:border-transparent outline-none transition-all"
            placeholder="Senha"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setAuthError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
          />
          {authError && <p className="text-red-600 text-sm font-medium">Senha incorreta.</p>}
          <div className="flex justify-end pt-2">
            <Button onClick={verifyPassword} className="w-full bg-[#011457] hover:bg-[#000d3d] h-12 text-base">
              Acessar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Form Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Evento"
      >
        {editingData && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Título</label>
              <input
                type="text"
                value={editingData.event.title}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#011457] outline-none"
                onChange={(e) => setEditingData({
                  ...editingData,
                  event: { ...editingData.event, title: e.target.value }
                })}
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Início</label>
                <input
                  type="time"
                  value={editingData.event.startTime}
                  required
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#011457] outline-none"
                  onChange={(e) => setEditingData({
                    ...editingData,
                    event: { ...editingData.event, startTime: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Fim</label>
                <input
                  type="time"
                  value={editingData.event.endTime}
                  required
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#011457] outline-none"
                  onChange={(e) => setEditingData({
                    ...editingData,
                    event: { ...editingData.event, endTime: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Change Day */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Dia</label>
              <select
                value={editingData.dayId} // Using dayId here means if they change it, `editingData.dayId` updates to the NEW target.
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#011457] outline-none bg-white"
                onChange={(e) => setEditingData({
                  ...editingData,
                  dayId: e.target.value
                })}
              >
                {schedule.map(d => (
                  <option key={d.id} value={d.id}>{d.dayName} - {d.date}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Descrição</label>
              <textarea
                rows={3}
                value={editingData.event.description || ''}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#011457] outline-none"
                onChange={(e) => setEditingData({
                  ...editingData,
                  event: { ...editingData.event, description: e.target.value }
                })}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1 border-slate-300 text-slate-700" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#011457] hover:bg-[#000d3d]">
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
}
