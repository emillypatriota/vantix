import { Component, signal, computed } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, CATEGORIES } from '../../../services/menu.service';
import { ImgFallbackDirective } from '../../../components/ui/img-fallback.directive';
import { ToastService } from '../../../services/toast.service';
import { MenuItem } from '../../../models';

interface MenuForm {
  name: string;
  description: string;
  price: number | null;
  category: string;
  image: string;
  isSpecial: boolean;
  brand: string;
  oldPrice: number | null;
  stock: number | null;
}

const EMPTY_FORM: MenuForm = {
  name: '', description: '', price: null,
  category: CATEGORIES[0], image: '',
  isSpecial: false, brand: '', oldPrice: null, stock: null,
};

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, FormsModule, ImgFallbackDirective],
  template: `
    <div style="max-width:1280px;margin:0 auto;padding:0 1.5rem">

      <!-- Page header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem" class="animate-fade-up">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary);margin-bottom:.25rem">
            Produtos
          </h1>
          <p style="color:var(--text-tertiary);font-size:var(--text-base)">
            Gerencie produtos, preços, estoque e disponibilidade
          </p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Item
        </button>
      </div>

      <!-- Toolbar -->
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap">
        <!-- Search -->
        <div class="search-input-wrapper" style="flex:1;min-width:220px;max-width:360px">
          <div class="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input class="form-input" type="text" placeholder="Buscar item..." [ngModel]="search()" (ngModelChange)="search.set($event)">
        </div>

        <!-- Category filter -->
        <div class="cat-nav dark-pills" style="flex:1;min-width:0">
          <button class="cat-pill" [class.active]="!activeCategory()" (click)="activeCategory.set('')">
            Todos ({{ allItems().length }})
          </button>
          <button *ngFor="let c of categories" class="cat-pill" [class.active]="activeCategory() === c" (click)="activeCategory.set(c)">
            {{ c }}
          </button>
        </div>

        <!-- Toggle show inactive -->
        <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:var(--text-sm);color:var(--text-secondary);white-space:nowrap">
          <div class="toggle">
            <input type="checkbox" [ngModel]="showInactive()" (ngModelChange)="showInactive.set($event)">
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </div>
          Mostrar inativos
        </label>
      </div>

      <!-- Stats row -->
      <div style="display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap" class="stagger">
        <div *ngFor="let s of statCards"
             style="flex:1;min-width:140px;padding:1rem 1.25rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl)">
          <div style="font-size:var(--text-xs);color:var(--text-tertiary);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.25rem">{{ s.label }}</div>
          <div style="font-family:var(--font-display);font-size:1.5rem;color:var(--text-primary)" [style.color]="s.color">{{ s.value }}</div>
        </div>
      </div>

      <!-- Grid of items -->
      <div *ngIf="!loading()" class="stagger"
           style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem">

        <div *ngFor="let item of filteredItems(); trackBy: trackById"
             class="menu-card-admin"
             [style.opacity]="item.active === false ? '.65' : '1'">

          <!-- Image -->
          <div class="menu-card-img">
            <img [src]="item.image" [alt]="item.name" loading="lazy"
                 appImgFallback
                 style="width:100%;height:100%;object-fit:cover">
            <div *ngIf="item.active === false" class="inactive-overlay">INATIVO</div>
            <div *ngIf="item.isSpecial" style="position:absolute;top:.75rem;left:.75rem;background:var(--brand-600);color:#fff;padding:.2rem .6rem;font-size:.65rem;letter-spacing:.1em;font-weight:600;border-radius:var(--r-sm)">
              DESTAQUE
            </div>
          </div>

          <!-- Body -->
          <div class="menu-card-body">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;margin-bottom:.375rem">
              <h3 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary);line-height:1.3">
                {{ item.name }}
              </h3>
              <span style="font-family:var(--font-display);font-size:1.1rem;color:var(--brand-400);flex-shrink:0;font-weight:600">
                {{ item.price | currency:'BRL':'symbol':'1.2-2' }}
              </span>
            </div>

            <div style="margin-bottom:.625rem">
              <span class="chip">{{ item.category }}</span>
              <span *ngIf="item.brand" class="chip" style="margin-left:.375rem">{{ item.brand }}</span>
              <span *ngIf="item.stock !== undefined" class="chip" style="margin-left:.375rem"
                    [style.color]="item.stock <= 5 ? 'var(--warning-text)' : null">📦 {{ item.stock }} un.</span>
            </div>

            <p style="font-size:var(--text-sm);color:var(--text-tertiary);line-height:1.55;margin-bottom:1rem;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">
              {{ item.description }}
            </p>

            <!-- Actions -->
            <div style="display:flex;align-items:center;gap:.5rem">
              <button class="btn btn-ghost btn-sm" (click)="openEdit(item)" style="flex:1;justify-content:center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>

              <button class="btn btn-sm"
                      [style.background]="item.active === false ? 'var(--success-bg)' : 'var(--neutral-bg)'"
                      [style.color]="item.active === false ? 'var(--success-text)' : 'var(--neutral-text)'"
                      [style.border]="'1px solid ' + (item.active === false ? 'var(--success-border)' : 'var(--neutral-border)')"
                      (click)="toggleActive(item)">
                {{ item.active === false ? 'Ativar' : 'Pausar' }}
              </button>

              <button class="btn btn-sm"
                      style="background:var(--danger-bg);color:var(--danger-text);border:1px solid var(--danger-border)"
                      (click)="confirmDelete(item)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="filteredItems().length === 0"
             style="grid-column:1/-1">
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>Nenhum item encontrado</h3>
            <p>Tente ajustar os filtros ou cadastre um novo produto.</p>
            <button class="btn btn-primary" style="margin-top:1.25rem" (click)="openAdd()">
              Adicionar Item
            </button>
          </div>
        </div>
      </div>

      <!-- Skeleton loading -->
      <div *ngIf="loading()" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem">
        <div *ngFor="let _ of [1,2,3,4,5,6]"
             style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden">
          <div class="skeleton" style="height:180px;border-radius:0"></div>
          <div style="padding:1rem">
            <div class="skeleton skeleton-text" style="height:16px;width:70%;margin-bottom:.75rem"></div>
            <div class="skeleton skeleton-text" style="height:12px;width:50%;margin-bottom:.5rem"></div>
            <div class="skeleton skeleton-text" style="height:12px;width:90%;margin-bottom:.5rem"></div>
            <div class="skeleton skeleton-text" style="height:12px;width:75%"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Add / Edit Modal ─────────────────────────────── -->
    <div *ngIf="showModal()" class="modal-overlay" (click)="closeModal()">
      <div class="modal" style="max-width:580px" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <h3>{{ editingId ? 'Editar produto' : 'Novo produto' }}</h3>
          <button class="btn btn-ghost btn-icon" (click)="closeModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body" style="display:flex;flex-direction:column;gap:1.25rem">

          <!-- Image preview -->
          <div *ngIf="form.image"
               style="width:100%;height:160px;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--border)">
            <img [src]="form.image" alt="" style="width:100%;height:100%;object-fit:cover"
                 onerror="this.style.display='none'">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Nome do produto *</label>
              <input class="form-input" [(ngModel)]="form.name" placeholder="Ex: Placa de Vídeo RTX 4060 8GB">
            </div>

            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Descrição *</label>
              <textarea class="form-input" [(ngModel)]="form.description" rows="3" placeholder="Principais especificações e diferenciais do produto..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Preço (R$) *</label>
              <input class="form-input" type="number" [(ngModel)]="form.price" placeholder="0,00" min="0" step="0.01">
            </div>

            <div class="form-group">
              <label class="form-label">Categoria *</label>
              <select class="form-input" [(ngModel)]="form.category">
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>
            </div>

            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">URL da imagem</label>
              <input class="form-input" [(ngModel)]="form.image" placeholder="https://...">
            </div>

            <div class="form-group">
              <label class="form-label">Marca</label>
              <input class="form-input" [(ngModel)]="form.brand" placeholder="Ex: NVIDIA">
            </div>

            <div class="form-group">
              <label class="form-label">Preço "de" (R$)</label>
              <input class="form-input" type="number" [(ngModel)]="form.oldPrice" placeholder="Opcional, para exibir desconto" min="0" step="0.01">
            </div>

            <div class="form-group">
              <label class="form-label">Estoque (unidades)</label>
              <input class="form-input" type="number" [(ngModel)]="form.stock" placeholder="Ex: 20" min="0">
            </div>

            <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;flex-direction:row;padding:.75rem 1rem;background:var(--bg-elevated);border-radius:var(--r-lg);border:1px solid var(--border)">
              <div>
                <div style="font-size:var(--text-base);font-weight:500;color:var(--text-secondary)">Item em Destaque</div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Aparece na seção de destaques</div>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="form.isSpecial">
                <div class="toggle-track"></div>
                <div class="toggle-thumb"></div>
              </label>
            </div>
          </div>

          <!-- Form error -->
          <div *ngIf="formError"
               style="background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--r-lg);padding:.75rem 1rem;font-size:var(--text-sm);color:var(--danger-text);display:flex;align-items:center;gap:.5rem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ formError }}
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="saving()">
            <span *ngIf="saving()" style="width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite"></span>
            {{ saving() ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Cadastrar produto') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete Confirm Modal ─────────────────────────── -->
    <div *ngIf="deleteTarget()" class="modal-overlay" (click)="deleteTarget.set(null)">
      <div class="modal" style="max-width:420px" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Remover Item</h3>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);line-height:1.65">
            Tem certeza que deseja remover <strong style="color:var(--text-primary)">{{ deleteTarget()?.name }}</strong> do catálogo?
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="deleteTarget.set(null)">Cancelar</button>
          <button class="btn btn-danger" (click)="deleteItem()">Remover Item</button>
        </div>
      </div>
    </div>

  `,
  styles: [`
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class MenuManagementComponent {
  // Totalmente reativo: lê diretamente dos signals do service — zero polling, zero memory leak
  readonly allItems = computed(() => this.menuService.items$());
  readonly loading  = computed(() => !this.menuService.loaded$());

  showModal    = signal(false);
  saving       = signal(false);
  deleteTarget = signal<MenuItem | null>(null);

  search         = signal('');
  activeCategory = signal('');
  showInactive   = signal(false);
  editingId: string | null = null;
  formError = '';

  form: MenuForm = { ...EMPTY_FORM };
  categories = CATEGORIES;

  constructor(
    private menuService: MenuService,
    private toast: ToastService
  ) {}

  filteredItems = computed(() => {
    let items = this.menuService.items$();
    if (!this.showInactive()) {
      items = items.filter(i => i.active !== false);
    }
    if (this.activeCategory()) {
      items = items.filter(i => i.category === this.activeCategory());
    }
    const q = this.search().toLowerCase();
    if (q) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }
    return items;
  });

  get statCards() {
    const all = this.allItems();
    return [
      { label: 'Total de Itens',   value: all.length,                                      color: 'var(--text-primary)' },
      { label: 'Ativos',           value: all.filter(i => i.active !== false).length,       color: 'var(--success-text)' },
      { label: 'Inativos',         value: all.filter(i => i.active === false).length,       color: 'var(--neutral-text)' },
      { label: 'Destaques',        value: all.filter(i => i.isSpecial).length,              color: 'var(--brand-400)' },
      { label: 'Categorias',       value: this.categories.length,                           color: 'var(--info-text)' },
    ];
  }

  trackById(_: number, item: MenuItem) { return item.id; }

  openAdd() {
    this.editingId = null;
    this.form = { ...EMPTY_FORM };
    this.formError = '';
    this.showModal.set(true);
  }

  openEdit(item: MenuItem) {
    this.editingId = item.id;
    this.form = {
      name:        item.name,
      description: item.description,
      price:       item.price,
      category:    item.category,
      image:       item.image,
      isSpecial:   !!item.isSpecial,
      brand:       item.brand ?? '',
      oldPrice:    item.oldPrice ?? null,
      stock:       item.stock ?? null,
    };
    this.formError = '';
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId = null;
    this.form = { ...EMPTY_FORM };
    this.formError = '';
  }

  async saveItem() {
    if (!this.form.name.trim()) { this.formError = 'O nome do produto é obrigatório.'; return; }
    if (!this.form.description.trim()) { this.formError = 'A descrição é obrigatória.'; return; }
    if (!this.form.price || this.form.price <= 0) { this.formError = 'Informe um preço válido.'; return; }

    this.formError = '';
    this.saving.set(true);

    const basePayload = {
      name:        this.form.name.trim(),
      description: this.form.description.trim(),
      price:       Number(this.form.price),
      category:    this.form.category,
      image:       this.form.image.trim(),
      isSpecial:   this.form.isSpecial,
      brand:       this.form.brand.trim(),
      // Firestore rejeita campos undefined: só envia o que foi preenchido
      ...(this.form.oldPrice ? { oldPrice: Number(this.form.oldPrice) } : {}),
      ...(this.form.stock !== null && this.form.stock !== undefined && String(this.form.stock) !== '' ? { stock: Number(this.form.stock) } : {}),
    };

    try {
      if (this.editingId) {
        await this.menuService.updateItem(this.editingId, basePayload);
        this.toast.show('Produto atualizado!');
      } else {
        await this.menuService.addItem({ ...basePayload, active: true });
        this.toast.show('Produto cadastrado!');
      }
      this.closeModal();
    } catch {
      this.formError = 'Erro ao salvar. Verifique a conexão e tente novamente.';
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(item: MenuItem) {
    const newActive = item.active === false ? true : false;
    await this.menuService.toggleItem(item.id, newActive);
    this.toast.show(newActive ? `"${item.name}" ativado` : `"${item.name}" pausado`);
  }

  confirmDelete(item: MenuItem) {
    this.deleteTarget.set(item);
  }

  async deleteItem() {
    const target = this.deleteTarget();
    if (!target) return;
    await this.menuService.deleteItem(target.id);
    this.toast.show(`"${target.name}" removido do catálogo`);
    this.deleteTarget.set(null);
  }
}
