import { Injectable, signal } from '@angular/core';
import { Rota } from '../models';

@Injectable({
    providedIn: 'root',
})
export class RotaStore {
    private currentRota = signal<Rota | null>(null);
    private isGenerating = signal<boolean>(false);
    private lastError = signal<string | null>(null);

    // Public readonly signals for components
    readonly rota = this.currentRota.asReadonly();
    readonly generating = this.isGenerating.asReadonly();
    readonly error = this.lastError.asReadonly();

    setRota(rota: Rota): void {
        this.currentRota.set(rota);
        this.lastError.set(null);
    }

    clearRota(): void {
        this.currentRota.set(null);
        this.lastError.set(null);
    }

    setGenerating(generating: boolean): void {
        this.isGenerating.set(generating);
    }

    setError(error: string): void {
        this.lastError.set(error);
        this.isGenerating.set(false);
    }

    clearError(): void {
        this.lastError.set(null);
    }
}
