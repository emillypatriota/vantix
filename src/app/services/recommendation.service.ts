import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem } from '../models';
import { ProdutoApi } from '../core/api/api.types';
import { productFromApi } from '../core/api/mappers';

/** "Quem comprou também levou" — usa a view vw_comprados_juntos do MySQL. */
@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private http = inject(HttpClient);

  /** Recomendações para um ou mais produtos (tela de produtos e carrinho). */
  forProducts(productIds: string[], limit = 4): Observable<MenuItem[]> {
    if (!productIds.length) return of([]);
    const params = new HttpParams().set('produtos', productIds.join(',')).set('limite', limit);
    return this.http.get<ProdutoApi[]>(`${environment.apiUrl}/recomendacoes`, { params }).pipe(
      map(list => list.map(productFromApi).filter(p => p.active !== false)),
      catchError(err => { console.error('[Recomendação] erro:', err); return of([]); }),
    );
  }
}
