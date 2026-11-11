import { Component, OnInit, signal, computed } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { StaffForm, StaffMember, StaffRole, StaffService } from '../../../services/staff.service';
import { apiErrorMessage } from '../../../core/api/auth.interceptor';

// Usuários que acessam os painéis (tabela usuario_painel do MySQL).
const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; bg: string; icon: string }> = {
  manager:  { label: 'Gerente',   color: '#3a6ff0', bg: 'rgba(58,111,240,.12)', icon: '👑' },
  kitchen:  { label: 'Estoque',   color: '#38bdf8', bg: 'rgba(56,189,248,.12)', icon: '📦' },
  delivery: { label: 'Logística', color: '#2dd4bf', bg: 'rgba(45,212,191,.12)', icon: '🚚' },
};

const STATUS_CONFIG = {
  active:   { label: 'Ativo',   color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  inactive: { label: 'Inativo', color: '#64748b', bg: 'rgba(100,116,139,.12)' },
};

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe],
  template: `
    <div style="max-width:1280px;margin:0 auto;padding:0 1.5rem 4rem">

      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary)">Funcionários</h1>
          <p style="color:var(--text-tertiary);font-size:var(--text-base);margin-top:.25rem">
            {{ activeCount }} ativos · {{ staff().length }} com acesso aos painéis
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
          <input type="text" placeholder="Buscar por nome ou e-mail..."
            [value]="search()" (input)="search.set($any($event.target).value)"
            style="width:100%;padding:.625rem .875rem .625rem 2.375rem;background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-primary);font-size:.82rem;outline:none">
        </div>

        <div style="display:flex;gap:.375rem;flex-wrap:wrap">
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

      <div *ngIf="loading()" style="text-align:center;padding:3rem;color:var(--text-muted)">Carregando funcionários...</div>

      <!-- Staff grid -->
      <div *ngIf="!loading()" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.125rem">
        <div *ngFor="let member of filtered()" class="staff-card"
             style="background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;transition:all .2s">

          <div style="height:3px" [style.background]="roleCfg(member.role).color"></div>

          <div style="padding:1.25rem">
            <div style="display:flex;align-items:flex-start;gap:.875rem;margin-bottom:1rem">
              <div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.125rem;flex-shrink:0"
                   [style.background]="roleCfg(member.role).bg">
                {{ roleCfg(member.role).icon }}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:var(--text-base);color:var(--text-primary);margin-bottom:.25rem">
                  {{ member.name }} <span *ngIf="isMe(member)" style="font-size:.68rem;color:var(--text-muted);font-weight:500">(você)</span>
                </div>
                <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
                  <span style="font-size:.68rem;font-weight:600;padding:.15rem .55rem;border-radius:var(--r-full)"
                        [style.background]="roleCfg(member.role).bg"
                        [style.color]="roleCfg(member.role).color">
                    {{ roleCfg(member.role).label }}
                  </span>
                  <span style="font-size:.68rem;font-weight:600;padding:.15rem .55rem;border-radius:var(--r-full)"
                        [style.background]="statusCfg(member).bg"
                        [style.color]="statusCfg(member).color">
                    {{ statusCfg(member).label }}
                  </span>
                </div>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1.125rem">
              <div style="display:flex;align-items:center;gap:.5rem;font-size:var(--text-sm);color:var(--text-secondary);overflow:hidden">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;color:var(--text-muted)"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ member.email }}</span>
              </div>
              <div *ngIf="member.createdAt" style="display:flex;align-items:center;gap:.5rem;font-size:var(--text-sm);color:var(--text-secondary)">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;color:var(--text-muted)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Cadastrado em {{ member.createdAt | date:'dd/MM/yyyy' }}
              </div>
            </div>

            <div style="display:flex;gap:.5rem">
              <button (click)="openModal(member)" class="staff-btn">Editar</button>
              <button (click)="toggleStatus(member)" class="staff-btn" [disabled]="isMe(member)"
                      [title]="isMe(member) ? 'Você não pode desativar o próprio usuário' : ''">
                {{ member.active ? 'Desativar' : 'Ativar' }}
              </button>
            </div>
          </div>
        </div>

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

          <div class="form-group">
            <label class="form-label">E-mail de login *</label>
            <input class="form-input" [(ngModel)]="form.email" type="email" placeholder="colaborador@voltz.com">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="form-group">
              <label class="form-label">Papel *</label>
              <select class="form-input" [(ngModel)]="form.role">
                <option value="manager">Gerente</option>
                <option value="kitchen">Estoque</option>
                <option value="delivery">Logística</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" [(ngModel)]="form.active">
                <option [ngValue]="true">Ativo</option>
                <option [ngValue]="false">Inativo</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ editingId ? 'Nova senha (deixe em branco para manter)' : 'Senha *' }}</label>
            <input class="form-input" [(ngModel)]="form.password" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres">
            <p class="form-hint">A senha é guardada com hash (BCrypt) no banco.</p>
          </div>

          <p *ngIf="formError" style="font-size:.8rem;color:var(--danger-text)">{{ formError }}</p>

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
    .staff-btn { flex:1; padding:.5rem; background:var(--surface-2,rgba(255,255,255,.04)); border:1px solid var(--border); border-radius:var(--r-lg); color:var(--text-secondary); font-size:.75rem; font-weight:500; cursor:pointer; transition:all .15s; }
    .staff-btn:hover:not(:disabled) { border-color:var(--border-strong); color:var(--text-primary); }
    .staff-btn:disabled { opacity:.45; cursor:not-allowed; }
  `]
})
export class StaffManagementComponent implements OnInit {
  staff = signal<StaffMember[]>([]);
  loading = signal(true);
  search = signal('');
  activeRole = signal<StaffRole | 'all'>('all');
  modalOpen = signal(false);
  saving = false;
  formError = '';
  editingId: string | null = null;

  form: StaffForm = this.emptyForm();

  roleFilters = [
    { label: 'Todos',     value: 'all'      as StaffRole | 'all' },
    { label: 'Gerente',   value: 'manager'  as StaffRole | 'all' },
    { label: 'Estoque',   value: 'kitchen'  as StaffRole | 'all' },
    { label: 'Logística', value: 'delivery' as StaffRole | 'all' },
  ];

  filtered = computed(() => {
    let list = this.staff();
    if (this.activeRole() !== 'all') list = list.filter(m => m.role === this.activeRole());
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    return list;
  });

  get activeCount() { return this.staff().filter(m => m.active).length; }

  get roleKpis() {
    return (Object.entries(ROLE_CONFIG) as [StaffRole, typeof ROLE_CONFIG[StaffRole]][]).map(([role, cfg]) => ({
      icon: cfg.icon, label: cfg.label,
      count: this.staff().filter(m => m.role === role).length,
    }));
  }

  constructor(private staffService: StaffService, private auth: AuthService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  private async load() {
    try { this.staff.set(await this.staffService.list()); }
    catch (err) { this.toast.show(apiErrorMessage(err, 'Erro ao carregar funcionários.'), 'error'); }
    finally { this.loading.set(false); }
  }

  isMe(m: StaffMember)        { return m.id === this.auth.getUser()?.uid; }
  roleCfg(role: StaffRole)    { return ROLE_CONFIG[role] ?? ROLE_CONFIG.kitchen; }
  statusCfg(m: StaffMember)   { return m.active ? STATUS_CONFIG.active : STATUS_CONFIG.inactive; }

  openModal(member?: StaffMember) {
    this.editingId = member?.id ?? null;
    this.formError = '';
    this.form = member
      ? { name: member.name, email: member.email, role: member.role, active: member.active, password: '' }
      : this.emptyForm();
    this.modalOpen.set(true);
  }

  closeModal() { this.modalOpen.set(false); }

  async save() {
    if (!this.form.name.trim())  { this.formError = 'Nome é obrigatório.'; return; }
    if (!/^\S+@\S+\.\S+$/.test(this.form.email.trim())) { this.formError = 'Informe um e-mail válido.'; return; }
    if (!this.editingId && this.form.password.length < 6) { this.formError = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    if (this.editingId && this.form.password && this.form.password.length < 6) { this.formError = 'A nova senha precisa ter pelo menos 6 caracteres.'; return; }

    this.saving = true;
    this.formError = '';
    try {
      if (this.editingId) {
        await this.staffService.update(this.editingId, this.form);
        this.toast.show('Funcionário atualizado!');
      } else {
        await this.staffService.create(this.form);
        this.toast.show('Funcionário adicionado!');
      }
      this.closeModal();
      await this.load();
    } catch (err) {
      this.formError = apiErrorMessage(err, 'Erro ao salvar. Tente novamente.');
    } finally {
      this.saving = false;
    }
  }

  async toggleStatus(member: StaffMember) {
    const next = !member.active;
    try {
      await this.staffService.setActive(member.id, next);
      this.toast.show(next ? `${member.name} ativado` : `${member.name} desativado`);
      await this.load();
    } catch (err) {
      this.toast.show(apiErrorMessage(err, 'Não foi possível alterar o status.'), 'error');
    }
  }

  private emptyForm(): StaffForm {
    return { name: '', email: '', role: 'kitchen', active: true, password: '' };
  }
}
