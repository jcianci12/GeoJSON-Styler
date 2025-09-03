import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface StyleruleDropdownState {
  column: string;
  ruletype: string | undefined;
  dynamic?: boolean;
}

type FeatureCollectionIndex = number;

@Injectable({ providedIn: 'root' })
export class StyleruleStateService {
  private stateSubject = new BehaviorSubject<Record<FeatureCollectionIndex, StyleruleDropdownState[]>>({});

  get state$() {
    return this.stateSubject.asObservable();
  }

  getStateForFeatureCollection(index: FeatureCollectionIndex): StyleruleDropdownState[] {
    const snapshot = this.stateSubject.value;
    return snapshot[index] ?? [];
  }

  setStateForFeatureCollection(index: FeatureCollectionIndex, state: StyleruleDropdownState[]): void {
    const snapshot = { ...this.stateSubject.value, [index]: state };
    this.stateSubject.next(snapshot);
  }

  setRule(index: FeatureCollectionIndex, ruleIndex: number, value: StyleruleDropdownState): void {
    const snapshot = { ...this.stateSubject.value };
    const arr = [...(snapshot[index] ?? [])];
    arr[ruleIndex] = value;
    snapshot[index] = arr;
    this.stateSubject.next(snapshot);
  }

  addRule(index: FeatureCollectionIndex, value: StyleruleDropdownState): void {
    const snapshot = { ...this.stateSubject.value };
    const arr = [...(snapshot[index] ?? [])];
    arr.push(value);
    snapshot[index] = arr;
    this.stateSubject.next(snapshot);
  }

  removeRule(index: FeatureCollectionIndex, ruleIndex: number): void {
    const snapshot = { ...this.stateSubject.value };
    const arr = [...(snapshot[index] ?? [])];
    if (ruleIndex >= 0 && ruleIndex < arr.length) {
      arr.splice(ruleIndex, 1);
      snapshot[index] = arr;
      this.stateSubject.next(snapshot);
    }
  }
}


