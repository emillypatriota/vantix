import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-portals',
  standalone: true,
  imports: [RouterLink, NgFor],
  template: `
    <div style="min-height:100vh;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:2rem">

      <!-- Background -->
      <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85"
           alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(7,13,28,.97) 0%,rgba(7,13,28,.88) 100%)"></div>

      <!-- Noise texture overlay -->
      <div style="position:absolute;inset:0;opacity:.03;pointer-events:none;background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')"></div>

      <!-- Glow orbs -->
      <div style="position:absolute;top:-20%;right:-10%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(58,111,240,.06) 0%,transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:-20%;left:-10%;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,.04) 0%,transparent 70%);pointer-events:none"></div>

      <div style="position:relative;z-index:1;max-width:820px;width:100%;text-align:center" class="stagger">

        <!-- Logo -->
        <div style="margin-bottom:3.5rem">
          <a routerLink="/" style="display:inline-flex;flex-direction:column;align-items:center;gap:0;text-decoration:none">
            <div style="
              width:52px;height:52px;border-radius:var(--r-xl);
              background:linear-gradient(135deg,var(--brand-500),var(--brand-800));
              display:flex;align-items:center;justify-content:center;
              font-family:var(--font-display);font-size:1.5rem;font-weight:700;color:#fff;
              margin-bottom:.875rem;box-shadow:0 8px 24px rgba(58,111,240,.3)
            ">V</div>
            <span style="font-family:var(--font-display);font-size:2.25rem;letter-spacing:.15em;color:#fff">VANTIX</span>
            <span style="font-size:.6rem;letter-spacing:.35em;color:var(--brand-400);margin-top:-4px">TECH STORE</span>
          </a>
          <div style="height:1px;width:3rem;background:linear-gradient(to right,transparent,rgba(58,111,240,.5),transparent);margin:1.25rem auto 1.75rem"></div>
          <p style="color:rgba(255,255,255,.35);font-size:.875rem;letter-spacing:.06em">
            Selecione o portal para acessar o sistema interno
          </p>
        </div>

        <!-- Portal cards -->
        <div class="portal-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-bottom:2.5rem">
          <a *ngFor="let p of portals" [routerLink]="p.link"
             style="
               display:flex;flex-direction:column;align-items:flex-start;
               padding:1.75rem 1.5rem;border-radius:var(--r-2xl);
               border:1px solid rgba(255,255,255,.08);
               background:rgba(255,255,255,.04);
               backdrop-filter:blur(12px);
               cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);
               text-decoration:none;text-align:left;position:relative;overflow:hidden
             "
             onmouseenter="this.style.background='rgba(255,255,255,.08)';this.style.borderColor='rgba(58,111,240,.25)';this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 40px rgba(0,0,0,.4)'"
             onmouseleave="this.style.background='rgba(255,255,255,.04)';this.style.borderColor='rgba(255,255,255,.08)';this.style.transform='';this.style.boxShadow=''">

            <!-- Glow on hover -->
            <div style="position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 30% 30%,rgba(58,111,240,.06),transparent 70%);pointer-events:none;transition:opacity .3s"></div>

            <div style="width:44px;height:44px;border-radius:var(--r-xl);display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:1.25rem;flex-shrink:0"
                 [style.background]="p.iconBg">
              {{ p.icon }}
            </div>

            <p style="color:#fff;font-weight:600;font-size:1rem;margin-bottom:.375rem;font-family:var(--font-display)">
              {{ p.label }}
            </p>
            <p style="color:rgba(255,255,255,.4);font-size:.8rem;line-height:1.65;margin-bottom:1.25rem;flex:1">
              {{ p.desc }}
            </p>

            <div style="display:flex;align-items:center;gap:.375rem;font-size:.78rem;font-weight:600"
                 [style.color]="p.accentColor">
              Acessar portal
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </a>
        </div>

        <!-- Demo credentials -->
        <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:var(--r-xl);padding:1.375rem 1.75rem;margin-bottom:2rem;backdrop-filter:blur(8px)">
          <p style="font-size:.65rem;color:rgba(255,255,255,.25);letter-spacing:.15em;margin-bottom:1rem;text-transform:uppercase">Credenciais de Demonstração</p>
          <div style="display:flex;justify-content:center;gap:3.5rem;flex-wrap:wrap">
            <div *ngFor="let c of credentials" style="text-align:center">
              <p style="font-size:.68rem;color:rgba(255,255,255,.3);margin-bottom:.25rem;letter-spacing:.08em">{{ c.role }}</p>
              <p style="font-family:var(--font-mono);font-size:.82rem;color:rgba(255,255,255,.7)">
                {{ c.user }}&#64;voltz.com
                <span style="color:var(--brand-400);margin-left:.25rem">/ voltz2024</span>
              </p>
            </div>
          </div>
        </div>

        <a routerLink="/"
           style="color:rgba(255,255,255,.25);font-size:.82rem;transition:color var(--transition-fast);display:inline-flex;align-items:center;gap:.375rem"
           onmouseenter="this.style.color='rgba(255,255,255,.6)'"
           onmouseleave="this.style.color='rgba(255,255,255,.25)'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Voltar ao site do cliente
        </a>

      </div>
    </div>
  `,
  styles: [`
    @media (max-width: 900px) { .portal-grid { grid-template-columns: 1fr 1fr !important; } }
    @media (max-width: 640px) { .portal-grid { grid-template-columns: minmax(0,1fr) !important; } }
  `]
})
export class PortalsComponent {
  portals = [
    {
      link: '/login/manager',
      icon: '🛡️',
      label: 'Gerente',
      desc: 'Dashboard completo, gestão de pedidos, catálogo e relatórios de desempenho em tempo real.',
      iconBg: 'rgba(29,91,214,.18)',
      accentColor: '#5f8ff7',
    },
    {
      link: '/login/kitchen',
      icon: '📦',
      label: 'Estoque',
      desc: 'Kanban em tempo real. Controle visual da separação, conferência e embalagem de cada pedido.',
      iconBg: 'rgba(2,132,199,.18)',
      accentColor: '#38bdf8',
    },
    {
      link: '/login/delivery',
      icon: '🚚',
      label: 'Logística',
      desc: 'Despache pacotes prontos, acompanhe envios em trânsito e confirme entregas.',
      iconBg: 'rgba(13,148,136,.18)',
      accentColor: '#2dd4bf',
    },
  ];

  credentials = [
    { role: 'GERENTE',    user: 'gerente'    },
    { role: 'ESTOQUE',    user: 'estoque'    },
    { role: 'LOGÍSTICA',  user: 'logistica'  },
  ];
}
