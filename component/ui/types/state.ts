// types/state.ts
export interface State {
  id: string;
  countryName: string;
  stateName: string;
  stateNameMarathi: string;
  stateNameHindi: string;
}

export interface AddSectionProps {
  onAddState: (state: Omit<State, 'id'>) => void;
}