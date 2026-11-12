import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { CartService, shippingFor, SHIPPING_FEE } from '../../services/cart.service';
import { ImgFallbackDirective } from '../../components/ui/img-fallback.directive';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../services/toast.service';
import { CustomerService } from '../../services/customer.service';
import { CartItem } from '../../models';
import { apiErrorMessage } from '../../core/api/auth.interceptor';

type PayMethod = 'pix' | 'credit' | 'debit' | 'boleto';
const MAX_INSTALLMENTS = 10;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, RouterLink, ImgFallbackDirective],
  template: `
    <div style="padding:2.5rem 0 5rem;background:var(--stone-50);min-height:100vh">
      <div class="container">

        <!-- Header -->
        <div style="margin-bottom:2rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <a routerLink="/carrinho" style="display:flex;align-items:center;gap:.375rem;color:var(--stone-400);font-size:.82rem;transition:color .2s" onmouseenter="this.style.color='var(--stone-700)'" onmouseleave="this.style.color=''">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Carrinho
          </a>
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="color:var(--stone-300)"><path d="M9 18l6-6-6-6"/></svg>
          <h1 style="font-family:var(--font-serif);font-size:1.875rem;color:var(--stone-900)">Finalizar Pedido</h1>
        </div>

        <!-- Step indicators -->
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:2rem;flex-wrap:wrap">
          <div *ngFor="let step of steps; let i = index" style="display:flex;align-items:center;gap:.5rem">
            <div style="display:flex;align-items:center;gap:.5rem">
              <div [style.background]="currentStep >= i+1 ? 'var(--stone-900)' : 'var(--stone-200)'"
                   [style.color]="currentStep >= i+1 ? '#fff' : 'var(--stone-500)'"
                   style="width:1.75rem;height:1.75rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;transition:all .3s">
                <svg *ngIf="currentStep > i+1" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span *ngIf="currentStep <= i+1">{{ i+1 }}</span>
              </div>
              <span style="font-size:.78rem;font-weight:500;white-space:nowrap"
                    [style.color]="currentStep >= i+1 ? 'var(--stone-800)' : 'var(--stone-400)'">{{ step }}</span>
            </div>
            <div *ngIf="i < steps.length-1" style="flex:1;min-width:24px;height:1px;background:var(--stone-200);margin:0 .25rem"></div>
          </div>
        </div>

        <!-- Form + Sidebar grid -->
        <div style="display:grid;grid-template-columns:1fr 380px;gap:2rem;align-items:start" class="checkout-grid">

          <!-- LEFT: form sections -->
          <div style="display:flex;flex-direction:column;gap:1.25rem">

            <!-- ── 1. Dados Pessoais ────────────────────── -->
            <div class="card">
              <div class="card-body">
                <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
                  <div style="width:2rem;height:2rem;border-radius:50%;background:var(--stone-900);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;flex-shrink:0">1</div>
                  <div>
                    <h2 style="font-family:var(--font-serif);font-size:1.3rem;color:var(--stone-900)">Dados Pessoais</h2>
                    <p style="font-size:.75rem;color:var(--stone-400)">Para confirmar seu pedido</p>
                  </div>
                </div>
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label">Nome Completo *</label>
                    <input class="form-input" [(ngModel)]="form.name" name="name" placeholder="Seu nome completo"
                           [class.input-error]="submitted && !form.name">
                    <span *ngIf="submitted && !form.name" class="form-error">Campo obrigatório</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label">WhatsApp *</label>
                    <input class="form-input" [value]="form.phone" (input)="formatPhone($event)" name="phone" placeholder="(11) 98765-4321" maxlength="15"
                           [class.input-error]="submitted && !form.phone">
                    <span *ngIf="submitted && !form.phone" class="form-error">Campo obrigatório</span>
                  </div>
                  <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">E-mail *</label>
                    <input class="form-input" type="email" [(ngModel)]="form.email" name="email" placeholder="voce@email.com"
                           [class.input-error]="submitted && !emailValid">
                    <span *ngIf="submitted && !emailValid" class="form-error">Informe um e-mail válido</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── 2. Endereço ──────────────────────────── -->
            <div class="card">
              <div class="card-body">
                <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
                  <div style="width:2rem;height:2rem;border-radius:50%;background:var(--stone-900);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;flex-shrink:0">2</div>
                  <div>
                    <h2 style="font-family:var(--font-serif);font-size:1.3rem;color:var(--stone-900)">Endereço de Entrega</h2>
                    <p style="font-size:.75rem;color:var(--stone-400)">Informe o CEP para preenchimento automático</p>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:1rem">

                  <!-- CEP row -->
                  <div style="display:flex;gap:.75rem;align-items:flex-end">
                    <div class="form-group" style="max-width:180px">
                      <label class="form-label">CEP *</label>
                      <div style="position:relative">
                        <input class="form-input" [value]="form.zipCode" (input)="formatCep($event)" name="zipCode" placeholder="00000-000" maxlength="9"
                               [class.input-error]="submitted && !form.zipCode"
                               style="padding-right:2.5rem">
                        <div *ngIf="cepLoading" style="position:absolute;right:.75rem;top:50%;transform:translateY(-50%);width:14px;height:14px;border:2px solid var(--stone-300);border-top-color:var(--stone-600);border-radius:50%;animation:spin .7s linear infinite"></div>
                      </div>
                    </div>
                    <button type="button" (click)="manualCepLookup()" [disabled]="cepLoading"
                            class="btn btn-secondary btn-sm" style="flex-shrink:0;margin-bottom:0">
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      Buscar
                    </button>
                  </div>
                  <p *ngIf="cepError" style="font-size:.75rem;color:var(--danger-text);margin-top:-.5rem">{{ cepError }}</p>
                  <p *ngIf="cepSuccess" style="font-size:.75rem;color:var(--success-text);margin-top:-.5rem;display:flex;align-items:center;gap:.3rem">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    Endereço preenchido automaticamente
                  </p>

                  <div style="display:grid;grid-template-columns:2fr 1fr;gap:1rem">
                    <div class="form-group">
                      <label class="form-label">Rua / Avenida *</label>
                      <input class="form-input" [(ngModel)]="form.address" name="address" placeholder="Nome da rua"
                             [class.input-error]="submitted && !form.address">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Número *</label>
                      <input class="form-input" [(ngModel)]="form.number" name="number" placeholder="123"
                             [class.input-error]="submitted && !form.number">
                    </div>
                  </div>

                  <div class="grid-2">
                    <div class="form-group">
                      <label class="form-label">Complemento</label>
                      <input class="form-input" [(ngModel)]="form.complement" name="complement" placeholder="Apto, Bloco, Casa...">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Bairro *</label>
                      <input class="form-input" [(ngModel)]="form.neighborhood" name="neighborhood" placeholder="Nome do bairro"
                             [class.input-error]="submitted && !form.neighborhood">
                    </div>
                  </div>

                  <div class="grid-2">
                    <div class="form-group">
                      <label class="form-label">Cidade *</label>
                      <input class="form-input" [(ngModel)]="form.city" name="city">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estado</label>
                      <input class="form-input" [(ngModel)]="form.state" name="state" maxlength="2" style="text-transform:uppercase">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── 3. Pagamento ────────────────────────── -->
            <div class="card">
              <div class="card-body">
                <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
                  <div style="width:2rem;height:2rem;border-radius:50%;background:var(--stone-900);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;flex-shrink:0">3</div>
                  <div>
                    <h2 style="font-family:var(--font-serif);font-size:1.3rem;color:var(--stone-900)">Forma de Pagamento</h2>
                    <p style="font-size:.75rem;color:var(--stone-400)">Ambiente 100% seguro e criptografado</p>
                  </div>
                </div>

                <!-- Payment method selector -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.625rem;margin-bottom:1.25rem" class="pay-grid">
                  <button *ngFor="let p of paymentMethods" type="button"
                    (click)="form.payment = p.value"
                    style="display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:.875rem .5rem;border-radius:var(--r-xl);border:2px solid;transition:all .2s;font-size:.72rem;font-weight:600"
                    [style.border-color]="form.payment===p.value ? p.border : 'var(--stone-200)'"
                    [style.background]="form.payment===p.value ? p.bg : '#fff'"
                    [style.color]="form.payment===p.value ? p.color : 'var(--stone-500)'">
                    <span style="font-size:1.5rem">{{ p.icon }}</span>
                    <span>{{ p.label }}</span>
                    <span *ngIf="form.payment===p.value" style="font-size:.6rem;opacity:.7">{{ p.sub }}</span>
                  </button>
                </div>

                <!-- ── PIX panel ─────────────────────── -->
                <div *ngIf="form.payment === 'pix'"
                     style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:var(--r-xl);padding:1.75rem;text-align:center;animation:fadeUp .3s ease">

                  <!-- QR Code SVG -->
                  <div style="display:inline-block;background:#fff;border-radius:var(--r-lg);padding:10px;margin-bottom:1.25rem;box-shadow:0 2px 12px rgba(0,0,0,.1)">
                    <svg width="140" height="140" viewBox="0 0 35 35" xmlns="http://www.w3.org/2000/svg">
                      <!-- finder TL -->
                      <rect x="1" y="1" width="9" height="9" fill="#000"/>
                      <rect x="2" y="2" width="7" height="7" fill="#fff"/>
                      <rect x="3" y="3" width="5" height="5" fill="#000"/>
                      <!-- finder TR -->
                      <rect x="25" y="1" width="9" height="9" fill="#000"/>
                      <rect x="26" y="2" width="7" height="7" fill="#fff"/>
                      <rect x="27" y="3" width="5" height="5" fill="#000"/>
                      <!-- finder BL -->
                      <rect x="1" y="25" width="9" height="9" fill="#000"/>
                      <rect x="2" y="26" width="7" height="7" fill="#fff"/>
                      <rect x="3" y="27" width="5" height="5" fill="#000"/>
                      <!-- timing H -->
                      <rect x="11" y="6" width="1" height="1" fill="#000"/>
                      <rect x="13" y="6" width="1" height="1" fill="#000"/>
                      <rect x="15" y="6" width="1" height="1" fill="#000"/>
                      <rect x="17" y="6" width="1" height="1" fill="#000"/>
                      <rect x="19" y="6" width="1" height="1" fill="#000"/>
                      <rect x="21" y="6" width="1" height="1" fill="#000"/>
                      <!-- timing V -->
                      <rect x="6" y="11" width="1" height="1" fill="#000"/>
                      <rect x="6" y="13" width="1" height="1" fill="#000"/>
                      <rect x="6" y="15" width="1" height="1" fill="#000"/>
                      <rect x="6" y="17" width="1" height="1" fill="#000"/>
                      <rect x="6" y="19" width="1" height="1" fill="#000"/>
                      <rect x="6" y="21" width="1" height="1" fill="#000"/>
                      <!-- data modules -->
                      <rect x="11" y="11" width="2" height="2" fill="#000"/>
                      <rect x="14" y="11" width="1" height="2" fill="#000"/>
                      <rect x="16" y="11" width="2" height="1" fill="#000"/>
                      <rect x="19" y="11" width="1" height="2" fill="#000"/>
                      <rect x="21" y="11" width="2" height="2" fill="#000"/>
                      <rect x="24" y="11" width="1" height="1" fill="#000"/>
                      <rect x="26" y="11" width="2" height="2" fill="#000"/>
                      <rect x="29" y="11" width="1" height="2" fill="#000"/>
                      <rect x="31" y="11" width="2" height="1" fill="#000"/>
                      <rect x="33" y="11" width="1" height="2" fill="#000"/>
                      <rect x="11" y="14" width="1" height="2" fill="#000"/>
                      <rect x="13" y="14" width="2" height="1" fill="#000"/>
                      <rect x="16" y="14" width="1" height="2" fill="#000"/>
                      <rect x="18" y="14" width="3" height="1" fill="#000"/>
                      <rect x="22" y="14" width="2" height="2" fill="#000"/>
                      <rect x="25" y="14" width="1" height="1" fill="#000"/>
                      <rect x="27" y="14" width="2" height="2" fill="#000"/>
                      <rect x="30" y="14" width="1" height="1" fill="#000"/>
                      <rect x="32" y="14" width="2" height="1" fill="#000"/>
                      <rect x="11" y="17" width="2" height="2" fill="#000"/>
                      <rect x="14" y="17" width="1" height="1" fill="#000"/>
                      <rect x="16" y="17" width="3" height="2" fill="#000"/>
                      <rect x="20" y="17" width="2" height="1" fill="#000"/>
                      <rect x="23" y="17" width="1" height="2" fill="#000"/>
                      <rect x="25" y="17" width="2" height="2" fill="#000"/>
                      <rect x="28" y="17" width="1" height="1" fill="#000"/>
                      <rect x="30" y="17" width="3" height="2" fill="#000"/>
                      <rect x="34" y="17" width="1" height="1" fill="#000"/>
                      <rect x="11" y="20" width="1" height="2" fill="#000"/>
                      <rect x="13" y="20" width="2" height="1" fill="#000"/>
                      <rect x="16" y="20" width="2" height="2" fill="#000"/>
                      <rect x="19" y="20" width="1" height="1" fill="#000"/>
                      <rect x="21" y="20" width="2" height="2" fill="#000"/>
                      <rect x="24" y="20" width="1" height="1" fill="#000"/>
                      <rect x="26" y="20" width="2" height="1" fill="#000"/>
                      <rect x="29" y="20" width="1" height="2" fill="#000"/>
                      <rect x="31" y="20" width="2" height="2" fill="#000"/>
                      <rect x="11" y="23" width="3" height="1" fill="#000"/>
                      <rect x="15" y="23" width="1" height="2" fill="#000"/>
                      <rect x="17" y="23" width="2" height="1" fill="#000"/>
                      <rect x="20" y="23" width="3" height="2" fill="#000"/>
                      <rect x="24" y="23" width="1" height="1" fill="#000"/>
                      <rect x="26" y="23" width="3" height="2" fill="#000"/>
                      <rect x="30" y="23" width="2" height="1" fill="#000"/>
                      <rect x="33" y="23" width="1" height="2" fill="#000"/>
                      <!-- bottom-right alignment -->
                      <rect x="20" y="25" width="5" height="5" fill="#000"/>
                      <rect x="21" y="26" width="3" height="3" fill="#fff"/>
                      <rect x="22" y="27" width="1" height="1" fill="#000"/>
                      <rect x="26" y="25" width="2" height="1" fill="#000"/>
                      <rect x="29" y="25" width="1" height="2" fill="#000"/>
                      <rect x="31" y="25" width="2" height="2" fill="#000"/>
                      <rect x="26" y="27" width="1" height="3" fill="#000"/>
                      <rect x="28" y="28" width="2" height="1" fill="#000"/>
                      <rect x="31" y="28" width="1" height="1" fill="#000"/>
                      <rect x="33" y="27" width="2" height="2" fill="#000"/>
                      <rect x="26" y="31" width="2" height="2" fill="#000"/>
                      <rect x="29" y="31" width="1" height="2" fill="#000"/>
                      <rect x="31" y="30" width="3" height="2" fill="#000"/>
                      <rect x="34" y="32" width="1" height="1" fill="#000"/>
                    </svg>
                  </div>

                  <h4 style="font-size:.95rem;font-weight:600;color:#166534;margin-bottom:.25rem">Pague com PIX</h4>
                  <p style="font-size:.8rem;color:#15803d;margin-bottom:1.125rem">Escaneia o QR Code ou copia a chave abaixo</p>

                  <!-- PIX key row -->
                  <div style="background:#fff;border-radius:var(--r-lg);border:1.5px solid #bbf7d0;display:flex;align-items:center;gap:.625rem;padding:.75rem 1rem;text-align:left;margin-bottom:.875rem">
                    <div style="flex:1;min-width:0;overflow:hidden">
                      <p style="font-size:.62rem;color:#6ee7b7;font-weight:600;letter-spacing:.12em;margin-bottom:2px">CHAVE PIX — CNPJ</p>
                      <code style="font-family:var(--font-mono);font-size:.85rem;color:#14532d;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ pixKey }}</code>
                    </div>
                    <button type="button" (click)="copyPix()"
                            [style.background]="pixCopied ? '#16a34a' : '#14532d'"
                            style="flex-shrink:0;padding:.4rem .875rem;border-radius:var(--r-lg);color:#fff;font-size:.78rem;font-weight:600;transition:all .25s;white-space:nowrap">
                      {{ pixCopied ? '✓ Copiado!' : 'Copiar' }}
                    </button>
                  </div>
                  <p style="font-size:.72rem;color:#15803d;display:flex;align-items:center;justify-content:center;gap:.375rem">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    Aprovação instantânea · QR Code válido por 30 minutos
                  </p>
                </div>

                <!-- ── Crédito / Débito panel ───────── -->
                <div *ngIf="form.payment === 'credit' || form.payment === 'debit'"
                     style="animation:fadeUp .3s ease">

                  <!-- Card visual preview -->
                  <div style="background:linear-gradient(135deg,#0b1b3f 0%,#1a2747 60%,#334155 100%);border-radius:var(--r-2xl);padding:1.5rem;color:#fff;position:relative;overflow:hidden;height:164px;margin-bottom:1.25rem;box-shadow:0 8px 24px rgba(0,0,0,.3)">
                    <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.04)"></div>
                    <div style="position:absolute;bottom:-40px;left:10px;width:180px;height:100px;border-radius:50%;background:rgba(58,111,240,.06)"></div>
                    <!-- Chip -->
                    <div style="width:38px;height:28px;border-radius:5px;background:linear-gradient(135deg,#5f8ff7,#1d5bd6);margin-bottom:.875rem;position:relative;z-index:1"></div>
                    <!-- Number -->
                    <div style="font-family:var(--font-mono);font-size:1.05rem;letter-spacing:.2em;margin-bottom:.875rem;position:relative;z-index:1;color:rgba(255,255,255,.9)">
                      {{ cardDisplay }}
                    </div>
                    <!-- Bottom -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:1">
                      <div>
                        <div style="font-size:.52rem;opacity:.45;letter-spacing:.12em;margin-bottom:2px">TITULAR</div>
                        <div style="font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.85);font-family:var(--font-mono)">{{ form.cardHolder || 'SEU NOME' }}</div>
                      </div>
                      <div style="text-align:right">
                        <div style="font-size:.52rem;opacity:.45;letter-spacing:.12em;margin-bottom:2px">VÁLIDO ATÉ</div>
                        <div style="font-family:var(--font-mono);font-size:.8rem;color:rgba(255,255,255,.85)">{{ form.cardExpiry || 'MM/AA' }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Card fields -->
                  <div style="display:flex;flex-direction:column;gap:1rem">
                    <div class="form-group">
                      <label class="form-label">Número do cartão *</label>
                      <input class="form-input" [value]="form.cardNumber" (input)="formatCard($event)" placeholder="0000 0000 0000 0000" maxlength="19"
                             style="font-family:var(--font-mono);font-size:1rem;letter-spacing:.08em"
                             [class.input-error]="submitted && (form.payment==='credit'||form.payment==='debit') && !form.cardNumber">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Nome do titular *</label>
                      <input class="form-input" [(ngModel)]="form.cardHolder" name="cardHolder" placeholder="Como aparece no cartão" style="text-transform:uppercase"
                             [class.input-error]="submitted && (form.payment==='credit'||form.payment==='debit') && !form.cardHolder">
                    </div>
                    <div class="grid-2">
                      <div class="form-group">
                        <label class="form-label">Validade *</label>
                        <input class="form-input" [value]="form.cardExpiry" (input)="formatExpiry($event)" placeholder="MM/AA" maxlength="5"
                               [class.input-error]="submitted && (form.payment==='credit'||form.payment==='debit') && !form.cardExpiry">
                      </div>
                      <div class="form-group">
                        <label class="form-label">CVV *</label>
                        <input class="form-input" [value]="form.cardCvv" (input)="formatCvv($event)" placeholder="000" maxlength="4" type="password"
                               [class.input-error]="submitted && (form.payment==='credit'||form.payment==='debit') && !form.cardCvv">
                      </div>
                    </div>

                    <!-- Installments (credit only) -->
                    <div *ngIf="form.payment === 'credit'" class="form-group">
                      <label class="form-label">Parcelas</label>
                      <select class="form-input" [(ngModel)]="form.installments" name="installments">
                        <option *ngFor="let opt of installmentOptions" [value]="opt.value">{{ opt.label }}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- ── Boleto panel ──────────────── -->
                <div *ngIf="form.payment === 'boleto'"
                     style="background:#eef4ff;border:1.5px solid #bfd2fd;border-radius:var(--r-xl);padding:1.375rem;animation:fadeUp .3s ease">
                  <div style="display:flex;align-items:center;gap:.75rem">
                    <div style="width:40px;height:40px;border-radius:var(--r-lg);background:#dbe6fe;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0">🧾</div>
                    <div>
                      <p style="font-weight:600;color:#173d8c;font-size:.88rem">Boleto bancário</p>
                      <p style="font-size:.75rem;color:#1747ad">O boleto é gerado após confirmar o pedido e vence em 3 dias úteis. A compensação leva até 2 dias úteis.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- ── 4. Observações ──────────────────── -->
            <div class="card">
              <div class="card-body">
                <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.125rem">
                  <div style="width:2rem;height:2rem;border-radius:50%;background:var(--stone-900);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;flex-shrink:0">4</div>
                  <h2 style="font-family:var(--font-serif);font-size:1.3rem;color:var(--stone-900)">Observações</h2>
                </div>
                <div class="form-group">
                  <textarea class="form-input" [(ngModel)]="form.observations" name="observations"
                    placeholder="Ponto de referência, horário preferido para entrega, nome de quem pode receber..." rows="3"></textarea>
                  <p class="form-hint">Estas informações são enviadas para a equipe de logística</p>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: order summary sidebar -->
          <div style="position:sticky;top:5.5rem">
            <div class="card" style="overflow:visible">
              <div class="card-body">
                <h2 style="font-family:var(--font-serif);font-size:1.375rem;margin-bottom:1.25rem;color:var(--stone-900)">Resumo do Pedido</h2>

                <!-- Free delivery banner -->
                <div *ngIf="deliveryFee === 0" style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:var(--r-lg);padding:.875rem;margin-bottom:1rem;display:flex;align-items:center;gap:.625rem">
                  <span style="font-size:1.25rem">🎉</span>
                  <div>
                    <p style="font-size:.82rem;font-weight:600;color:#15803d">Frete grátis conquistado!</p>
                    <p style="font-size:.72rem;color:#166534">Economia de {{ brl(shippingFee) }} no frete</p>
                  </div>
                </div>

                <!-- Trust signals -->
                <div style="background:var(--stone-50);border-radius:var(--r-lg);padding:.875rem;margin-bottom:1.25rem;display:flex;flex-direction:column;gap:.375rem;font-size:.8rem;color:var(--stone-600)">
                  <div style="display:flex;align-items:center;gap:.5rem"><span>🚚</span> Envio em até 24h após aprovação</div>
                  <div style="display:flex;align-items:center;gap:.5rem"><span>🔒</span> Ambiente 100% seguro</div>
                  <div style="display:flex;align-items:center;gap:.5rem"><span>🛡️</span> Garantia oficial do fabricante</div>
                </div>

                <!-- Items list -->
                <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem;max-height:220px;overflow-y:auto;padding-right:.25rem">
                  <div *ngFor="let item of cartItems" style="display:flex;align-items:center;gap:.625rem">
                    <img [src]="item.image" [alt]="item.name"
                         appImgFallback
                         style="width:2.5rem;height:2.5rem;border-radius:var(--r-md);object-fit:cover;flex-shrink:0;border:1px solid var(--stone-100)">
                    <div style="flex:1;min-width:0">
                      <p style="font-size:.78rem;font-weight:500;color:var(--stone-700);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.quantity }}× {{ item.name }}</p>
                    </div>
                    <span style="font-size:.82rem;font-weight:600;color:var(--stone-800);flex-shrink:0">{{ brl((item.price*item.quantity)) }}</span>
                  </div>
                </div>

                <!-- Totals -->
                <div style="border-top:1px solid var(--stone-100);padding-top:.875rem;margin-bottom:1.375rem;display:flex;flex-direction:column;gap:.5rem">
                  <div style="display:flex;justify-content:space-between;font-size:.85rem">
                    <span style="color:var(--stone-500)">Subtotal</span>
                    <span style="color:var(--stone-800)">{{ brl(subtotal) }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:.85rem">
                    <span style="color:var(--stone-500)">Frete</span>
                    <span [style.color]="deliveryFee===0?'#16a34a':'var(--stone-800)'">
                      {{ deliveryFee === 0 ? 'Grátis' : brl(deliveryFee) }}
                    </span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-family:var(--font-serif);font-size:1.35rem;border-top:1px solid var(--stone-100);padding-top:.875rem;margin-top:.25rem">
                    <span style="color:var(--stone-900)">Total</span>
                    <span style="color:var(--stone-900)">{{ brl(total) }}</span>
                  </div>
                  <div *ngIf="form.payment==='credit' && form.installments !== '1'"
                       style="text-align:right;font-size:.75rem;color:var(--stone-400)">
                    {{ form.installments }}× de {{ brl((total / +form.installments)) }} sem juros
                  </div>
                </div>

                <button type="button" (click)="submit()" class="btn btn-primary"
                        style="width:100%;justify-content:center;height:3.25rem;font-size:.95rem;border-radius:var(--r-xl);gap:.625rem"
                        [disabled]="submitting">
                  <span *ngIf="submitting" style="width:16px;height:16px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0"></span>
                  <svg *ngIf="!submitting" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  {{ submitting ? 'Processando...' : 'Confirmar Pedido' }}
                </button>

                <p style="font-size:.7rem;color:var(--stone-400);text-align:center;margin-top:.75rem;line-height:1.5">
                  Ao confirmar você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin    { to { transform:rotate(360deg); } }
    @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @media(max-width:900px) { .checkout-grid { grid-template-columns: minmax(0,1fr) !important; } }
    @media(max-width:480px) { .pay-grid { grid-template-columns: repeat(2,1fr) !important; } }
    @media(max-width:640px) { .grid-2 { grid-template-columns: minmax(0,1fr) !important; } }
  `]
})
export class CheckoutComponent implements OnInit {
  brl(v: number) { return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  form = {
    name: '', phone: '', email: '', zipCode: '', address: '', number: '',
    complement: '', neighborhood: '', city: 'São Paulo', state: 'SP',
    payment: 'pix' as PayMethod, observations: '',
    cardNumber: '', cardHolder: '', cardExpiry: '', cardCvv: '',
    installments: '1',
  };

  steps = ['Dados Pessoais', 'Endereço', 'Pagamento', 'Revisão'];
  get currentStep() {
    if (!this.form.name || !this.form.phone || !this.emailValid) return 1;
    if (!this.form.address || !this.form.number) return 2;
    return 3;
  }

  paymentMethods = [
    { value: 'pix'    as PayMethod, icon: '⚡', label: 'PIX',      sub: 'Instantâneo', border: '#22c55e', bg: '#f0fdf4', color: '#15803d' },
    { value: 'credit' as PayMethod, icon: '💳', label: 'Crédito',  sub: 'Até 10× s/ juros',     border: '#6366f1', bg: '#eef2ff', color: '#4338ca' },
    { value: 'debit'  as PayMethod, icon: '💳', label: 'Débito',   sub: 'Na conta',    border: '#0ea5e9', bg: '#f0f9ff', color: '#0369a1' },
    { value: 'boleto' as PayMethod, icon: '🧾', label: 'Boleto',   sub: 'Até 3 dias',  border: '#3a6ff0', bg: '#eef4ff', color: '#173d8c' },
  ];

  cepLoading = false;
  cepError   = '';
  cepSuccess = false;
  pixCopied  = false;
  submitted  = false;
  submitting = false;
  pixKey     = '11.222.333/0001-44';

  cartItems: CartItem[] = [];
  subtotal = 0;

  shippingFee = SHIPPING_FEE;
  get deliveryFee() { return shippingFor(this.subtotal); }
  get total()       { return this.subtotal + this.deliveryFee; }

  get cardDisplay(): string {
    const n = this.form.cardNumber.replace(/\s/g, '');
    const groups = [n.slice(0,4), n.slice(4,8), n.slice(8,12), n.slice(12,16)];
    return groups.map(g => g.padEnd(4, '•')).join(' ');
  }

  get installmentOptions() {
    return Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1).map(n => ({
      value: String(n),
      label: n === 1
        ? `1× de ${this.brl(this.total)} (à vista)`
        : `${n}× de ${this.brl(this.total / n)} sem juros`,
    }));
  }

  constructor(
    private cart: CartService,
    private orders: OrdersService,
    private toast: ToastService,
    private router: Router,
    private customers: CustomerService,
  ) {}

  get emailValid() { return /^\S+@\S+\.\S+$/.test(this.form.email.trim()); }

  ngOnInit() {
    this.cartItems = this.cart.getItems();
    this.subtotal  = this.cart.getTotal();
    if (!this.cartItems.length) this.router.navigate(['/carrinho']);
    // Cliente já identificado: preenche nome, telefone e e-mail
    const c = this.customers.customer();
    if (c) {
      this.form.name  = c.name;
      this.form.phone = c.phone;
      this.form.email = c.email;
    }
  }

  // ── Input formatters ──────────────────────────────────────────
  formatPhone(e: Event) {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7)      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    this.form.phone = v;
    (e.target as HTMLInputElement).value = v;
  }

  formatCep(e: Event) {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    const fmt = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v;
    this.form.zipCode = fmt;
    (e.target as HTMLInputElement).value = fmt;
    if (v.length === 8) this.doLookupCep(v);
  }

  manualCepLookup() {
    const v = this.form.zipCode.replace(/\D/g, '');
    if (v.length === 8) this.doLookupCep(v);
    else this.cepError = 'Digite um CEP válido (8 dígitos).';
  }

  private async doLookupCep(cep: string) {
    this.cepLoading = true;
    this.cepError   = '';
    this.cepSuccess = false;
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { this.cepError = 'CEP não encontrado. Preencha o endereço manualmente.'; return; }
      this.form.address      = data.logradouro  || '';
      this.form.neighborhood = data.bairro       || '';
      this.form.city         = data.localidade   || '';
      this.form.state        = data.uf           || '';
      this.cepSuccess = true;
    } catch {
      this.cepError = 'Não foi possível consultar o CEP. Preencha manualmente.';
    } finally {
      this.cepLoading = false;
    }
  }

  formatCard(e: Event) {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 16) v = v.slice(0, 16);
    const fmt = v.replace(/(.{4})/g, '$1 ').trim();
    this.form.cardNumber = fmt;
    (e.target as HTMLInputElement).value = fmt;
  }

  formatExpiry(e: Event) {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    const fmt = v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v;
    this.form.cardExpiry = fmt;
    (e.target as HTMLInputElement).value = fmt;
  }

  formatCvv(e: Event) {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    this.form.cardCvv = v;
    (e.target as HTMLInputElement).value = v;
  }

  async copyPix() {
    try { await navigator.clipboard.writeText(this.pixKey); } catch { /* ignore */ }
    this.pixCopied = true;
    setTimeout(() => this.pixCopied = false, 2500);
  }

  private isFormValid(): boolean {
    const base = !!(this.form.name && this.form.phone && this.emailValid && this.form.zipCode
                    && this.form.address && this.form.number && this.form.neighborhood);
    if (this.form.payment === 'credit' || this.form.payment === 'debit') {
      return base && !!(this.form.cardNumber && this.form.cardHolder
                        && this.form.cardExpiry && this.form.cardCvv);
    }
    return base;
  }

  async submit() {
    this.submitted = true;
    if (!this.isFormValid()) {
      this.toast.show('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    this.submitting = true;

    // Os dados do cartão não são enviados nem gravados: a API recebe só forma e parcelas.
    const installments = this.form.payment === 'credit' ? Number(this.form.installments) : 1;

    try {
      const addr = [
        `${this.form.address}, ${this.form.number}`,
        this.form.complement ? `— ${this.form.complement}` : '',
        `— ${this.form.neighborhood}`,
        `, ${this.form.city} — ${this.form.state}`,
        `, CEP ${this.form.zipCode}`,
      ].filter(Boolean).join(' ');

      const order = await this.orders.addOrder({
        items:        this.cartItems,
        customer:     { name: this.form.name.trim(), phone: this.form.phone, email: this.form.email.trim().toLowerCase(), address: addr },
        payment:      { method: this.form.payment, installments },
        observations: this.form.observations,
      });
      this.customers.remember({ name: this.form.name.trim(), phone: this.form.phone, email: this.form.email.trim().toLowerCase() });
      this.cart.clear();
      this.toast.show('Pedido realizado com sucesso! 🎉');
      this.router.navigate(['/confirmacao'], { state: { order } });
    } catch (err) {
      this.toast.show(apiErrorMessage(err, 'Erro ao salvar pedido. Tente novamente.'), 'error');
      this.submitting = false;
    }
  }
}
