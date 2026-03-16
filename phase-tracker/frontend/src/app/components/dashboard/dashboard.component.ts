import { Component, OnInit } from '@angular/core';
import { PhaseService } from '../../services/phase.service';
import { Phase } from '../../models/phase.model';
import { CommonModule } from '@angular/common';
import { PhaseCardComponent } from '../phase-card/phase-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PhaseCardComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  phases: Phase[] = [];
  newPhaseTitle: string = '';
  phaseError: string = '';

  constructor(private phaseService: PhaseService) { }

  ngOnInit(): void {
    this.loadPhases();
  }

  loadPhases(): void {
    console.log('[Dashboard] Fetching phases...');
    this.phaseService.getPhases().subscribe({
      next: (data) => {
        console.log('[Dashboard] Phases loaded:', data);
        this.phases = [...data].sort((a, b) =>
          (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' })
        );
      },
      error: (err) => {
        console.error('[Dashboard] Error fetching phases:', err);
        alert('Failed to load phases. Check console for details.');
      }
    });
  }

  createPhase(): void {
    if (!this.newPhaseTitle || !this.newPhaseTitle.trim()) {
      this.phaseError = 'Enter a phase name first.';
      setTimeout(() => (this.phaseError = ''), 2000);
      return;
    }
    this.phaseError = '';
    console.log('[Dashboard] Creating phase:', this.newPhaseTitle);
    this.phaseService.addPhase(this.newPhaseTitle).subscribe({
      next: (phase) => {
        console.log('[Dashboard] Phase created:', phase);
        // Re-fetch to ensure we have the latest state from the API
        this.loadPhases();
        this.newPhaseTitle = '';
      },
      error: (err) => {
        console.error('Error adding phase:', err);
        alert('Failed to add phase. Check console.');
      }
    });
  }

  onPhaseDeleted(phaseId: string): void {
    this.phases = this.phases.filter(p => p._id !== phaseId);
  }

  get totalTasks(): number {
    return this.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
  }

  get completedTasks(): number {
    return this.phases.reduce((acc, phase) => acc + phase.tasks.filter(t => t.done).length, 0);
  }

  get overallProgressInfo(): { percentage: number, text: string } {
    const total = this.totalTasks;
    if (total === 0) return { percentage: 0, text: 'No task added' };
    const percentage = Math.round((this.completedTasks / total) * 100);
    return { percentage, text: `${percentage}%` };
  }
}
