import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Troca a imagem por um placeholder da marca quando o src falha
 * (link quebrado, foto removida do Unsplash, URL digitada errada no admin).
 * Uso: <img [src]="item.image" appImgFallback>
 */
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#eef4ff"/>
  <g fill="none" stroke="#93b4fb" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <rect x="130" y="95" width="140" height="90" rx="10"/>
    <path d="M110 205h180"/>
    <path d="M190 150l14-18 14 18"/>
  </g>
  <text x="200" y="245" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="16" fill="#5f8ff7">Imagem indisponível</text>
</svg>`);

@Directive({ selector: 'img[appImgFallback]', standalone: true })
export class ImgFallbackDirective {
  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError(): void {
    const img = this.el.nativeElement;
    if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
  }
}
