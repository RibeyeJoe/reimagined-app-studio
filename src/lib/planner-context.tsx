import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type {
  PlannerState, StepId, IntakeState, GoalsState, GeoState,
  AudiencesState, ChannelsState, PlanOption, SavedPlan,
  RecommendationSection, QuickStartState, SavedSessionRow,
  HistoricalPerformance,
} from "./schema";

const defaultIntake: IntakeState = {
  websiteUrl: "", businessName: "", locations: "", monthlyBudget: 5000,
  detected: null, analyzed: false, flightStart: "", flightEnd: "",
};

const defaultGoals: GoalsState = { goal: null, kpis: [], channelMixMode: "expand" };
const defaultGeo: GeoState = { geoType: null, geoValue: "", strategies: [] };
const defaultAudiences: AudiencesState = { audiences: [], conquestEnabled: false };
const defaultChannels: ChannelsState = { allocations: [], locked: true, activePreset: null };
const defaultQuickStart: QuickStartState = { budget: null, goal: null, websiteUrl: "" };

const defaultState: PlannerState = {
  currentStep: "intake",
  planningPath: "new",
  intake: defaultIntake,
  goals: defaultGoals,
  geo: defaultGeo,
  audiences: defaultAudiences,
  channels: defaultChannels,
  options: [],
  savedPlans: [],
  recommendations: null,
  quickStart: defaultQuickStart,
  historicalData: [],
  performanceUploaded: false,
  performanceAdvertisers: [],
  performanceAdvertiserCode: null,
  performanceAdvertiserName: null,
  performanceDMAs: [],
  performanceZIPs: [],
  performanceChannels: [],
};

interface PlannerContextType {
  state: PlannerState;
  setStep: (step: StepId) => void;
  updateIntake: (partial: Partial<IntakeState>) => void;
  updateGoals: (partial: Partial<GoalsState>) => void;
  updateGeo: (partial: Partial<GeoState>) => void;
  updateAudiences: (partial: Partial<AudiencesState>) => void;
  updateChannels: (partial: Partial<ChannelsState>) => void;
  setOptions: (options: PlanOption[]) => void;
  savePlan: (plan: SavedPlan) => void;
  setRecommendations: (rec: RecommendationSection | null) => void;
  updateQuickStart: (partial: Partial<QuickStartState>) => void;
  resetPlanner: () => void;
  setState: (updater: (prev: PlannerState) => PlannerState) => void;
  setHistoricalData: (data: HistoricalPerformance[]) => void;
  savedSessions: SavedSessionRow[];
  saveSession: (name: string) => Promise<void>;
  loadSession: (id: number) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  sessionsLoading: boolean;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

function migrateState(saved: any): PlannerState {
  return {
    ...defaultState, ...saved,
    intake: { ...defaultIntake, ...(saved.intake || {}) },
    audiences: { ...defaultAudiences, ...(saved.audiences || {}) },
    channels: { ...defaultChannels, ...(saved.channels || {}) },
    quickStart: saved.quickStart || defaultQuickStart,
    recommendations: saved.recommendations || null,
    historicalData: saved.historicalData || [],
  };
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<PlannerState>(() => {
    const saved = localStorage.getItem("ribeye-planner-state");
    if (saved) { try { return migrateState(JSON.parse(saved)); } catch {} }
    return defaultState;
  });

  const [savedSessions, setSavedSessions] = useState<SavedSessionRow[]>(() => {
    const saved = localStorage.getItem("ribeye-saved-sessions");
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return [];
  });

  const persist = useCallback((newState: PlannerState) => {
    localStorage.setItem("ribeye-planner-state", JSON.stringify(newState));
  }, []);

  const persistSessions = useCallback((sessions: SavedSessionRow[]) => {
    localStorage.setItem("ribeye-saved-sessions", JSON.stringify(sessions));
  }, []);

  const setStep = useCallback((step: StepId) => {
    setStateRaw(prev => { const next = { ...prev, currentStep: step }; persist(next); return next; });
  }, [persist]);

  const updateIntake = useCallback((partial: Partial<IntakeState>) => {
    setStateRaw(prev => { const next = { ...prev, intake: { ...prev.intake, ...partial } }; persist(next); return next; });
  }, [persist]);

  const updateGoals = useCallback((partial: Partial<GoalsState>) => {
    setStateRaw(prev => { const next = { ...prev, goals: { ...prev.goals, ...partial } }; persist(next); return next; });
  }, [persist]);

  const updateGeo = useCallback((partial: Partial<GeoState>) => {
    setStateRaw(prev => { const next = { ...prev, geo: { ...prev.geo, ...partial } }; persist(next); return next; });
  }, [persist]);

  const updateAudiences = useCallback((partial: Partial<AudiencesState>) => {
    setStateRaw(prev => { const next = { ...prev, audiences: { ...prev.audiences, ...partial } }; persist(next); return next; });
  }, [persist]);

  const updateChannels = useCallback((partial: Partial<ChannelsState>) => {
    setStateRaw(prev => { const next = { ...prev, channels: { ...prev.channels, ...partial } }; persist(next); return next; });
  }, [persist]);

  const setOptions = useCallback((options: PlanOption[]) => {
    setStateRaw(prev => { const next = { ...prev, options }; persist(next); return next; });
  }, [persist]);

  const savePlan = useCallback((plan: SavedPlan) => {
    setStateRaw(prev => { const next = { ...prev, savedPlans: [...prev.savedPlans, plan] }; persist(next); return next; });
  }, [persist]);

  const setRecommendations = useCallback((rec: RecommendationSection | null) => {
    setStateRaw(prev => { const next = { ...prev, recommendations: rec }; persist(next); return next; });
  }, [persist]);

  const updateQuickStart = useCallback((partial: Partial<QuickStartState>) => {
    setStateRaw(prev => { const next = { ...prev, quickStart: { ...prev.quickStart, ...partial } }; persist(next); return next; });
  }, [persist]);

  const setHistoricalData = useCallback((data: HistoricalPerformance[]) => {
    setStateRaw(prev => { const next = { ...prev, historicalData: data }; persist(next); return next; });
  }, [persist]);

  const resetPlanner = useCallback(() => {
    setStateRaw(defaultState);
    localStorage.removeItem("ribeye-planner-state");
  }, []);

  const saveSession = useCallback(async (name: string) => {
    const newSession: SavedSessionRow = {
      id: Date.now(), name, state,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    persistSessions(updated);
  }, [state, savedSessions, persistSessions]);

  const loadSession = useCallback(async (id: number) => {
    const session = savedSessions.find(s => s.id === id);
    if (session) {
      const migrated = migrateState(session.state);
      setStateRaw(migrated);
      persist(migrated);
    }
  }, [savedSessions, persist]);

  const deleteSession = useCallback(async (id: number) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    persistSessions(updated);
  }, [savedSessions, persistSessions]);

  const setState = useCallback((updater: (prev: PlannerState) => PlannerState) => {
    setStateRaw(prev => { const next = updater(prev); persist(next); return next; });
  }, [persist]);

  return (
    <PlannerContext.Provider value={{
      state, setStep, updateIntake, updateGoals, updateGeo,
      updateAudiences, updateChannels, setOptions, savePlan,
      setRecommendations, updateQuickStart, resetPlanner, setState,
      setHistoricalData,
      savedSessions, saveSession, loadSession, deleteSession,
      sessionsLoading: false,
    }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}
