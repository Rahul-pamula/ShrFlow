import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Phase } from '../models/phase.model';
import { Task } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PhaseService {
  private apiUrl = `${environment.backendUrl}/api`;

  constructor(private http: HttpClient) {
    // Helpful runtime log to verify configured backend
    console.log('[PhaseService] Using API base:', this.apiUrl);
  }

  // Phases
  getPhases(): Observable<Phase[]> {
    return this.http.get<Phase[]>(`${this.apiUrl}/phases`);
  }

  addPhase(title: string): Observable<Phase> {
    return this.http.post<Phase>(`${this.apiUrl}/phases`, { title });
  }

  updatePhase(id: string, title: string): Observable<Phase> {
    return this.http.put<Phase>(`${this.apiUrl}/phases/${id}`, { title });
  }

  deletePhase(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/phases/${id}`);
  }

  // Tasks
  addTask(phaseId: string, text: string, done: boolean = false): Observable<Phase> {
    return this.http.post<Phase>(`${this.apiUrl}/phases/${phaseId}/tasks`, { text, done });
  }

  updateTask(taskId: string, text?: string, done?: boolean): Observable<Phase> {
    const payload: any = {};
    if (text !== undefined) payload.text = text;
    if (done !== undefined) payload.done = done;
    return this.http.put<Phase>(`${this.apiUrl}/tasks/${taskId}`, payload);
  }

  deleteTask(taskId: string): Observable<Phase> {
    return this.http.delete<Phase>(`${this.apiUrl}/tasks/${taskId}`);
  }
}
