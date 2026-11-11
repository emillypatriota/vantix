import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserRole } from '../models';
import { FuncionarioRequest, UsuarioApi } from '../core/api/api.types';
import { parseApiDate, roleFromApi, roleToApi } from '../core/api/mappers';

export type StaffRole = Exclude<UserRole, null>;

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  createdAt?: Date;
}

export interface StaffForm {
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  password: string;
}

/** Usuários dos painéis (tabela usuario_painel). Só o gerente acessa. */
@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/funcionarios`;

  async list(): Promise<StaffMember[]> {
    const list = await firstValueFrom(this.http.get<UsuarioApi[]>(this.base));
    return list.map(u => ({
      id:        String(u.id),
      name:      u.nome,
      email:     u.email,
      role:      roleFromApi(u.papel),
      active:    u.ativo !== false,
      createdAt: u.dataCriacao ? parseApiDate(u.dataCriacao) : undefined,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(form: StaffForm): Promise<void> {
    await firstValueFrom(this.http.post(this.base, this.toApi(form)));
  }

  async update(id: string, form: StaffForm): Promise<void> {
    await firstValueFrom(this.http.put(`${this.base}/${id}`, this.toApi(form)));
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.base}/${id}/ativo`, { ativo: active }));
  }

  private toApi(f: StaffForm): FuncionarioRequest {
    const body: FuncionarioRequest = {
      nome:  f.name.trim(),
      email: f.email.trim().toLowerCase(),
      papel: roleToApi(f.role),
      ativo: f.active,
    };
    if (f.password) body.senha = f.password;
    return body;
  }
}
