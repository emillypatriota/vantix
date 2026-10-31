import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../../../core/firebase/firebase.config';
import { ToastService } from '../../../services/toast.service';

// 'cashier' = Atendimento/SAC · 'waiter' = Vendas (ids mantidos da versão anterior)
type StaffRole = 'manager' | 'kitchen' | 'delivery' | 'cashier' | 'waiter';
type StaffStatus = 'active' | 'inactive' | 'on_leave';

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  status: StaffStatus;
  schedule: string;
  hireDate: string;
  notes?: string;
  createdAt?: any;
}

const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; bg: string; icon: string }> = {
  manager:  { label: 'Gerente',    color: '#3a6ff0', bg: 'rgba(58,111,240,.12)', icon: '👑' },
  kitchen:  { label: 'Estoque',    color: '#38bdf8', bg: 'rgba(56,189,248,.12)', icon: '📦' },
  delivery: { label: 'Logística',  color: '#2dd4bf', bg: 'rgba(45,212,191,.12)', icon: '🚚' },
  cashier:  { label: 'Atendimento', color: '#a78bfa', bg: 'rgba(167,139,250,.12)', icon: '🎧' },
  waiter:   { label: 'Vendas',     color: '#f472b6', bg: 'rgba(244,114,182,.12)', icon: '🛒' },
};

const STATUS_CONFIG: Record<StaffStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Ativo',    color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  inactive: { label: 'Inativo',  color: '#64748b', bg: 'rgba(100,116,139,.12)' },
  on_leave: { label: 'Licença',  color: '#3a6ff0', bg: 'rgba(58,111,240,.12)' },
};

const SEED_STAFF: Omit<StaffMember, 'id'>[] = [
  { name: 'Roberto Silva',   role: 'manager',  phone: '(11) 98765-4321', email: 'gerente@voltz.com',    status: 'active',   schedule: 'Seg–Sex 09h–18h', hireDate: '2022-03-01' },
  { name: 'Ana Souza',       role: 'kitchen',  phone: '(11) 97654-3210', email: 'ana.souza@voltz.com',  status: 'active',   schedule: 'Ter–Dom 12h–21h', hireDate: '2022-06-15' },
  { name: 'Carlos Mendes',   role: 'delivery', phone: '(11) 96543-2109', email: 'logistica@voltz.com', status: 'active',   schedule: 'Seg–Sáb 08h–17h', hireDate: '2023-01-10' },
  { name: 'Fernanda Lima',   role: 'cashier',  phone: '(11) 95432-1098', email: 'f.lima@voltz.com',     status: 'active',   schedule: 'Seg–Sex 11h–20h', hireDate: '2023-04-20' },
  { name: 'Paulo Ferreira',  role: 'waiter',   phone: '(11) 94321-0987', email: 'p.ferreira@voltz.com', status: 'active',   schedule: 'Seg–Sex 09h–18h', hireDate: '2023-07-05' },
  { name: 'Mariana Costa',   role: 'kitchen',  phone: '(11) 93210-9876', email: 'm.costa@voltz.com',    status: 'on_leave', schedule: 'Seg–Sex 08h–17h', hireDate: '2022-09-12' },
];

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <div style="max-width:1280px;margin:0 auto;padding:0 1.5rem 4rem">

      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary)">Funcionários</h1>
          <p style="color:var(--text-tertiary);font-size:var(--text-base);margin-top:.25rem">
            {{ activeCount }} ativos · {{ staff().length }} no total
          </p>
        </div>
        <button (click)="openModal()" class="btn btn-primary" style="display:flex;align-items:center;gap:.5rem">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Novo Funcionário
        </button>
      </div>

      <!-- KPI strip -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.875rem;margin-bottom:1.75rem">
        <div *ngFor="let r of roleKpis" style="background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-xl);padding:.875rem 1rem">
          <div style="font-size:1.25rem;margin-bottom:.25rem">{{ r.icon }}</div>
          <div style="font-size:1.75rem;font-weight:700;color:var(--text-primary)">{{ r.count }}</div>
          <div style="font-size:.7rem;font-weight:600;letter-spacing:.08em;color:var(--text-muted)">{{ r.label }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display:flex;gap:.875rem;flex-wrap:wrap;margin-bottom:1.25rem">
        <div style="position:relative;flex:1;min-width:200px">
          <svg style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);color:var(--text-muted)" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Buscar por nome, cargo ou telefone..."
            [value]="search()" (input)="search.set($any($event.target).value)"
            style="width:100%;padding:.625rem .875rem .625rem 2.375rem;background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-primary);font-size:.82rem;outline:none">
        </div>

        <div style="display:flex;gap:.375rem">
          <button *ngFor="let f of roleFilters"
            (click)="activeRole.set(f.value)"
            [style.background]="activeRole()===f.value ? 'var(--brand-600)' : 'var(--surface-1)'"
            [style.color]="activeRole()===f.value ? '#fff' : 'var(--text-muted)'"
            [style.borderColor]="activeRole()===f.value ? 'var(--brand-600)' : 'var(--border)'"
            style="padding:.5rem .875rem;border-radius:var(--r-full);font-size:.75rem;font-weight:500;border:1px solid;transition:all .15s;cursor:pointer;white-space:nowrap">
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Staff grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.125rem">
        <div *ngFor="let member of filtered()" class="staff-card"
             style="background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;transition:all .2s">

          <!-- Color top bar -->
          <div style="height:3px" [style.background]="roleCfg(member.role).color"></div>

          <div style="padding:1.25rem">
            <!-- Avatar + name -->
            <div style="display:flex;align-items:flex-start;gap:.875rem;margin-bottom:1rem">
              <div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.125rem;flex-shrink:0"
                   [style.background]="roleCfg(member.role).bg">
                {{ roleCfg(member.role).icon }}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:var(--text-base);color:var(--text-primary);margin-bottom:.25rem">{{ member.name }}</div>
                <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
                  <span style="font-size:.68rem;font-weight:600;padding:.15rem .55rem;border-radius:var(--r-full)"
                        [style.background]="roleCfg(member.role).bg"
                        [style.color]="roleCfg(member.role).color">
                    {{ roleCfg(member.role).label }}
                  </span>
                  <span style="font-size:.68rem;font-weight:600;padding:.15rem .55rem;border-radius:var(--r-full)"
                        [style.background]="statusCfg(member.status).bg"
                        [style.color]="statusCfg(member.status).color">
                    {{ statusCfg(member.status).label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Info rows -->
            <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1.125rem">
              <div style="display:flex;align-items:center;gap:.5rem;font-size:var(--text-sm);color:var(--text-secondary)">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;color:var(--text-muted)"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                {{ member.phone }}
              </div>
              <div style="display:flex;align-items:center;gap:.5rem;font-size:var(--text-sm);color:var(--text-secondary)">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;color:var(--text-muted)"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {{ member.email }}
              </div>
              <div style="display:flex;align-items:center;gap:.5rem;font-size:var(--text-sm);color:var(--text-secondary)">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;color:var(--text-muted)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ member.schedule }}
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:.5rem">
              <button (click)="openModal(member)"
                style="flex:1;padding:.5rem;background:var(--surface-2,rgba(255,255,255,.04));border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-secondary);font-size:.75rem;font-weight:500;cursor:pointer;transition:all .15s"
                onmouseenter="this.style.borderColor='var(--border-strong)';this.style.color='var(--text-primary)'"
                onmouseleave="this.style.borderColor='';this.style.color=''">
                Editar
              </button>
              <button (click)="toggleStatus(member)"
                style="flex:1;padding:.5rem;background:var(--surface-2,rgba(255,255,255,.04));border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-secondary);font-size:.75rem;font-weight:500;cursor:pointer;transition:all .15s"
                onmouseenter="this.style.borderColor='var(--border-strong)';this.style.color='var(--text-primary)'"
                onmouseleave="this.style.borderColor='';this.style.color=''">
                {{ member.status === 'active' ? 'Desativar' : 'Ativar' }}
              </button>
              <button (click)="remove(member.id)"
                style="width:2.25rem;background:var(--surface-2,rgba(255,255,255,.04));border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-muted);font-size:.8rem;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center"
                onmouseenter="this.style.borderColor='#ef4444';this.style.color='#ef4444'"
                onmouseleave="this.style.borderColor='';this.style.color=''">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="filtered().length === 0" style="grid-column:1/-1;text-align:center;padding:4rem 2rem;background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-2xl)">
          <div style="font-size:3rem;margin-bottom:1rem">👥</div>
          <p style="color:var(--text-muted)">Nenhum funcionário encontrado</p>
        </div>
      </div>

    </div>

    <!-- Modal -->
    <div *ngIf="modalOpen()" style="position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:500;display:flex;align-items:center;justify-content:center;padding:1rem" (click)="closeModal()">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-2xl);width:100%;max-width:500px;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">

        <div style="padding:1.5rem 1.5rem 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
          <h2 style="font-family:var(--font-display);font-size:1.25rem;color:var(--text-primary)">
            {{ editingId ? 'Editar Funcionário' : 'Novo Funcionário' }}
          </h2>
          <button (click)="closeModal()" style="color:var(--text-muted);background:none;border:none;cursor:pointer;font-size:1.25rem;line-height:1">×</button>
        </div>

        <div style="padding:0 1.5rem 1.5rem;display:flex;flex-direction:column;gap:1rem">

          <div class="form-group">
            <label class="form-label">Nome completo *</label>
            <input class="form-input" [(ngModel)]="form.name" placeholder="Ex: João Silva">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="form-group">
              <label class="form-label">Cargo *</label>
              <select class="form-input" [(ngModel)]="form.role">
                <option value="manager">Gerente</option>
                <option value="kitchen">Estoque</option>
                <option value="delivery">Logística</option>
                <option value="cashier">Atendimento</option>
                <option value="waiter">Vendas</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" [(ngModel)]="form.status">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="on_leave">Licença</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input class="form-input" [(ngModel)]="form.phone" placeholder="(11) 99999-9999">
            </div>
            <div class="form-group">
              <label class="form-label">Data de admissão</label>
              <input class="form-input" [(ngModel)]="form.hireDate" type="date">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input class="form-input" [(ngModel)]="form.email" type="email" placeholder="colaborador@voltz.com">
          </div>

          <div class="form-group">
            <label class="form-label">Escala / Horário</label>
            <input class="form-input" [(ngModel)]="form.schedule" placeholder="Ex: Seg–Sex 09h–18h">
          </div>

          <div class="form-group">
            <label class="form-label">Observações</label>
            <textarea class="form-input" [(ngModel)]="form.notes" rows="2" placeholder="Informações adicionais..."></textarea>
          </div>

          <div style="display:flex;gap:.75rem;padding-top:.5rem">
            <button (click)="closeModal()" class="btn btn-outline" style="flex:1">Cancelar</button>
            <button (click)="save()" class="btn btn-primary" style="flex:1" [disabled]="saving">
              {{ saving ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Adicionar') }}
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .staff-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); transform: translateY(-2px); }
  `]
})
export class StaffManagementComponent implements OnInit, OnDestroy {
  staff = signal<StaffMember[]>([]);
  search = signal('');
  activeRole = signal<StaffRole | 'all'>('all');
  modalOpen = signal(false);
  saving = false;
  editingId: string | null = null;
  private unsubStaff?: () => void;

  form: Omit<StaffMember, 'id'> = this.emptyForm();

  roleFilters = [
    { label: 'Todos',      value: 'all'      as StaffRole | 'all' },
    { label: 'Gerente',    value: 'manager'  as StaffRole | 'all' },
    { label: 'Estoque',    value: 'kitchen'  as StaffRole | 'all' },
    { label: 'Logística',  value: 'delivery' as StaffRole | 'all' },
    { label: 'Atendimento', value: 'cashier'  as StaffRole | 'all' },
    { label: 'Vendas',     value: 'waiter'   as StaffRole | 'all' },
  ];

  filtered = computed(() => {
    let list = this.staff();
    if (this.activeRole() !== 'all') list = list.filter(m => m.role === this.activeRole());
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.email.toLowerCase().includes(q)
    );
    return list;
  });

  get activeCount() { return this.staff().filter(m => m.status === 'active').length; }

  get roleKpis() {
    return Object.entries(ROLE_CONFIG).map(([role, cfg]) => ({
      icon: cfg.icon, label: cfg.label,
      count: this.staff().filter(m => m.role === role).length,
    }));
  }

  constructor(private toast: ToastService) {}

  ngOnInit() {
    const q = query(collection(firestore, 'staff'), orderBy('name'));
    this.unsubStaff = onSnapshot(q, async snapshot => {
      if (snapshot.empty) { await this.seed(); return; }
      this.staff.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)));
    }, err => console.error('[StaffManagement] Firestore error:', err));
  }

  ngOnDestroy() {
    this.unsubStaff?.();
  }

  private async seed() {
    for (const member of SEED_STAFF) {
      await addDoc(collection(firestore, 'staff'), { ...member, createdAt: serverTimestamp() });
    }
  }

  roleCfg(role: StaffRole)     { return ROLE_CONFIG[role]   ?? ROLE_CONFIG.waiter; }
  statusCfg(status: StaffStatus) { return STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive; }

  openModal(member?: StaffMember) {
    this.editingId = member?.id ?? null;
    this.form = member
      ? { name: member.name, role: member.role, phone: member.phone, email: member.email, status: member.status, schedule: member.schedule, hireDate: member.hireDate, notes: member.notes }
      : this.emptyForm();
    this.modalOpen.set(true);
  }

  closeModal() { this.modalOpen.set(false); }

  async save() {
    if (!this.form.name.trim()) { this.toast.show('Nome é obrigatório', 'error'); return; }
    this.saving = true;
    try {
      if (this.editingId) {
        await updateDoc(doc(firestore, 'staff', this.editingId), { ...this.form });
        this.toast.show('Funcionário atualizado!');
      } else {
        await addDoc(collection(firestore, 'staff'), { ...this.form, createdAt: serverTimestamp() });
        this.toast.show('Funcionário adicionado!');
      }
      this.closeModal();
    } catch { this.toast.show('Erro ao salvar. Tente novamente.', 'error'); }
    finally { this.saving = false; }
  }

  async toggleStatus(member: StaffMember) {
    const next: StaffStatus = member.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(firestore, 'staff', member.id), { status: next });
    this.toast.show(next === 'active' ? `${member.name} ativado` : `${member.name} desativado`);
  }

  async remove(id: string) {
    if (!confirm('Remover este funcionário?')) return;
    await deleteDoc(doc(firestore, 'staff', id));
    this.toast.show('Funcionário removido');
  }

  private emptyForm(): Omit<StaffMember, 'id'> {
    return { name: '', role: 'waiter', phone: '', email: '', status: 'active', schedule: '', hireDate: '', notes: '' };
  }
}
