import { EffectModule, Module, Reducer, Effect, Action } from '@sigi/core'
import { History, LocationState, LocationDescriptorObject } from 'history'
import { Observable } from 'rxjs'
import { tap, map, withLatestFrom } from 'rxjs/operators'

export interface RouterState {
  history: History | null
}

export type HistoryMethods = 'go' | 'goBack' | 'goForward' | 'push' | 'replace'

export interface CallHistoryPayload {
  method: HistoryMethods
  payloads: any[]
}

@Module('@@Router')
export class RouterModule extends EffectModule<RouterState> {
  readonly defaultState = {
    history: null,
  }

  // @internal
  @Reducer()
  setHistory(state: RouterState, history: History) {
    if (state.history && process.env.NODE_ENV === 'development') {
      console.warn(
        'History in RouterModule has already defined, have you wrapped your application with SigiRouterProvider muti times?',
      )
    }
    return { history }
  }

  push(location: LocationDescriptorObject<LocationState>): Action<CallHistoryPayload>

  push(path: string, state?: LocationState): Action<CallHistoryPayload>

  push(path: LocationDescriptorObject<LocationState> | string, state?: LocationState): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'push', payloads: [path, state] })
  }

  go(n: number) {
    return this.getActions()._callHistory({ method: 'go', payloads: [n] })
  }

  goBack(): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'goBack', payloads: [] })
  }
  goForward(): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'goForward', payloads: [] })
  }

  replace(path: string, state?: LocationState): Action<CallHistoryPayload>
  replace(location: LocationDescriptorObject<LocationState>): Action<CallHistoryPayload>

  replace(path: string | LocationDescriptorObject<LocationState>, state?: LocationState): Action<CallHistoryPayload> {
    return this.getActions()._callHistory({ method: 'replace', payloads: [path, state] })
  }

  // @internal
  @Effect()
  _callHistory(payload$: Observable<CallHistoryPayload>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      tap(([{ method, payloads }, state]) => {
        const history: any = state.history
        history[method].apply(state.history, payloads)
      }),
      map(() => this.createNoopAction()),
    )
  }
}
