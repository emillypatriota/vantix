import { Injectable, signal } from '@angular/core';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../core/firebase/firebase.config';
import { MenuItem } from '../models';

// Catálogo inicial da loja — é gravado no Firestore na primeira execução.
// As fotos são do Unsplash; se alguma falhar, o [appImgFallback] mostra um placeholder.
export const INITIAL_MENU: Omit<MenuItem, 'id'>[] = [
  // ── Hardware ────────────────────────────────────────────────
  {
    name: 'Placa de Vídeo GeForce RTX 4070 SUPER 12GB',
    description: 'Arquitetura Ada Lovelace, DLSS 3 e Ray Tracing de 3ª geração. Ideal para jogar em 1440p com taxas altas e para acelerar edição de vídeo e IA.',
    price: 4899.9, oldPrice: 5599.9, category: 'Hardware', brand: 'NVIDIA', stock: 14, isSpecial: true,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
  },
  {
    name: 'Processador AMD Ryzen 7 7800X3D',
    description: '8 núcleos, 16 threads e 96MB de cache L3 com tecnologia 3D V-Cache. Um dos processadores mais rápidos para jogos. Soquete AM5.',
    price: 2399.9, oldPrice: 2799.9, category: 'Hardware', brand: 'AMD', stock: 22, isSpecial: true,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80',
  },
  {
    name: 'SSD NVMe 2TB PCIe 4.0',
    description: 'Leitura de até 7.000 MB/s. Carregamentos quase instantâneos em jogos e sistema. Formato M.2 2280, com dissipador opcional.',
    price: 899.9, oldPrice: 1099.9, category: 'Hardware', brand: 'Kingston', stock: 40,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80',
  },
  {
    name: 'Memória DDR5 32GB (2x16GB) 6000MHz RGB',
    description: 'Kit dual channel com perfil EXPO/XMP e iluminação RGB endereçável. Latência CL30 para máximo desempenho em plataformas AM5 e Intel.',
    price: 749.9, oldPrice: 899.9, category: 'Hardware', brand: 'Corsair', stock: 31,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&q=80',
  },
  {
    name: 'PC Gamer Ryzen 7 · RTX 4070 · 32GB',
    description: 'Máquina montada e testada: Ryzen 7 7700, RTX 4070, 32GB DDR5, SSD 1TB e fonte 750W 80 Plus Gold. Pronto para jogar em 1440p.',
    price: 8999.9, oldPrice: 10499.9, category: 'Hardware', brand: 'VOLTZ', stock: 6, isSpecial: true,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
  },
  // ── Periféricos ─────────────────────────────────────────────
  {
    name: 'Teclado Mecânico Gamer RGB ABNT2',
    description: 'Switches mecânicos lineares, keycaps PBT double-shot e layout ABNT2 com Ç. Iluminação RGB por tecla e cabo USB-C removível.',
    price: 349.9, oldPrice: 449.9, category: 'Periféricos', brand: 'Redragon', stock: 58,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
  },
  {
    name: 'Mouse Gamer Sem Fio 26.000 DPI',
    description: 'Sensor óptico de alta precisão, apenas 63g e bateria de até 70 horas. Conexão 2.4GHz de baixa latência e Bluetooth.',
    price: 499.9, oldPrice: 649.9, category: 'Periféricos', brand: 'Logitech', stock: 37,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80',
  },
  {
    name: 'Headset Sem Fio com Cancelamento de Ruído',
    description: 'Drivers de 40mm, cancelamento ativo de ruído e microfone com redução de ruído por IA. Até 30 horas de bateria.',
    price: 899.9, oldPrice: 1199.9, category: 'Periféricos', brand: 'Sony', stock: 19,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  },
  // ── Monitores ───────────────────────────────────────────────
  {
    name: 'Monitor Gamer 27" QHD 170Hz IPS',
    description: 'Resolução 2560x1440, 1ms GtG, HDR10 e compatibilidade G-Sync. Cores precisas com 95% DCI-P3 e base com ajuste de altura.',
    price: 1799.9, oldPrice: 2199.9, category: 'Monitores', brand: 'LG', stock: 17,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
  },
  {
    name: 'Monitor Ultrawide 34" Curvo 165Hz',
    description: 'Proporção 21:9, curvatura 1500R e resolução UWQHD. Mais área de trabalho para produtividade e imersão total em jogos.',
    price: 2699.9, oldPrice: 3199.9, category: 'Monitores', brand: 'Samsung', stock: 9,
    image: 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=800&q=80',
  },
  // ── Notebooks ───────────────────────────────────────────────
  {
    name: 'Notebook Gamer Intel Core i7 · RTX 4060',
    description: 'Tela 15,6" 144Hz, 16GB DDR5, SSD 512GB e teclado RGB. Sistema de refrigeração com dupla ventoinha para longas sessões.',
    price: 6499.9, oldPrice: 7499.9, category: 'Notebooks', brand: 'Acer', stock: 12,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
  },
  {
    name: 'Notebook Ultrafino 14" Intel Core Ultra 5',
    description: 'Apenas 1,2kg, 16GB de RAM, SSD 512GB e bateria para o dia inteiro. Tela 2.8K OLED para trabalho e estudo.',
    price: 4299.9, oldPrice: 4899.9, category: 'Notebooks', brand: 'ASUS', stock: 21,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  },
  {
    name: 'MacBook Air 13" Chip M3 8GB 256GB',
    description: 'Chip Apple M3, tela Liquid Retina e até 18 horas de bateria. Sem ventoinha: silêncio total mesmo sob carga.',
    price: 8999.0, oldPrice: 9999.0, category: 'Notebooks', brand: 'Apple', stock: 8,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  },
  // ── Smartphones ─────────────────────────────────────────────
  {
    name: 'Smartphone 5G 256GB Tela AMOLED 120Hz',
    description: 'Câmera principal de 50MP com estabilização óptica, 8GB de RAM e bateria de 5000mAh com carregamento rápido de 45W.',
    price: 2499.9, oldPrice: 2999.9, category: 'Smartphones', brand: 'Samsung', stock: 44,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
  },
  {
    name: 'iPhone 15 128GB',
    description: 'Dynamic Island, câmera de 48MP e conector USB-C. Chip A16 Bionic com desempenho e eficiência de ponta.',
    price: 5299.0, oldPrice: 5999.0, category: 'Smartphones', brand: 'Apple', stock: 16,
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
  },
  {
    name: 'Smartwatch com GPS e Monitor Cardíaco',
    description: 'Tela AMOLED always-on, GPS integrado, mais de 100 modos de treino e até 10 dias de bateria. Resistente à água 5ATM.',
    price: 1199.9, oldPrice: 1499.9, category: 'Smartphones', brand: 'Garmin', stock: 27,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
  },
  {
    name: 'Tablet 11" 128GB com Caneta',
    description: 'Tela 2.5K de 90Hz, quatro alto-falantes e caneta inclusa. Perfeito para estudos, anotações e streaming.',
    price: 1899.9, oldPrice: 2299.9, category: 'Smartphones', brand: 'Xiaomi', stock: 23,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
  },
  // ── Games ───────────────────────────────────────────────────
  {
    name: 'Console PlayStation 5 Slim',
    description: 'SSD ultrarrápido de 1TB, suporte a 4K 120fps e Ray Tracing. Inclui controle DualSense com feedback háptico.',
    price: 3799.9, oldPrice: 4499.9, category: 'Games', brand: 'Sony', stock: 11,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
  },
  {
    name: 'Controle Sem Fio DualSense',
    description: 'Feedback háptico, gatilhos adaptáveis e microfone embutido. Compatível com PS5 e PC.',
    price: 429.9, oldPrice: 499.9, category: 'Games', brand: 'Sony', stock: 63,
    image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80',
  },
  {
    name: 'Cadeira Gamer Reclinável 180°',
    description: 'Estrutura em aço, espuma de alta densidade, apoio de braço 4D e almofadas lombar e cervical. Suporta até 150kg.',
    price: 1099.9, oldPrice: 1399.9, category: 'Games', brand: 'ThunderX3', stock: 15,
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80',
  },
];

export const CATEGORIES = ['Hardware', 'Periféricos', 'Monitores', 'Notebooks', 'Smartphones', 'Games'];

// Coleção separada da versão restaurante ('menu') para o seed rodar num projeto Firebase já usado.
export const PRODUCTS_COLLECTION = 'products';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private _items  = signal<MenuItem[]>([]);
  private _loaded = signal(false);

  readonly items$  = this._items.asReadonly();
  readonly loaded$ = this._loaded.asReadonly();

  constructor() { this.listenToMenu(); }

  private listenToMenu(): void {
    const q = query(collection(firestore, PRODUCTS_COLLECTION), orderBy('category'));
    onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        try {
          await this.seedMenu();
          // loaded remains false — next snapshot (post-seed) will set it
        } catch (e) {
          console.error('[MenuService] Seed error (verifique regras do Firestore):', e);
          this._loaded.set(true); // para o skeleton mesmo com erro de seed
        }
        return;
      }
      this._items.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
      this._loaded.set(true);
    }, err => {
      console.error('[MenuService] Firestore read error:', err);
      this._loaded.set(true); // para o skeleton mesmo com erro
    });
  }

  private async seedMenu(): Promise<void> {
    for (const item of INITIAL_MENU) {
      await addDoc(collection(firestore, PRODUCTS_COLLECTION), { ...item, createdAt: serverTimestamp(), active: true });
    }
  }

  getAll(): MenuItem[] { return this._items(); }
  getCategories(): string[] { return CATEGORIES; }
  getByCategory(cat: string): MenuItem[] { return this._items().filter(i => i.category === cat); }
  getSpecials(): MenuItem[] { return this._items().filter(i => i.isSpecial).slice(0, 3); }

  async addItem(item: Omit<MenuItem, 'id'>): Promise<void> {
    await addDoc(collection(firestore, PRODUCTS_COLLECTION), { ...item, createdAt: serverTimestamp(), active: true });
  }
  async updateItem(id: string, data: Partial<MenuItem>): Promise<void> {
    await updateDoc(doc(firestore, PRODUCTS_COLLECTION, id), data);
  }
  async deleteItem(id: string): Promise<void> {
    await deleteDoc(doc(firestore, PRODUCTS_COLLECTION, id));
  }
  async toggleItem(id: string, active: boolean): Promise<void> {
    await updateDoc(doc(firestore, PRODUCTS_COLLECTION, id), { active });
  }
}
