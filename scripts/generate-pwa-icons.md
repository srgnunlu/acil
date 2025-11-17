# PWA Icon Generation Guide

Bu dosya, PWA için gerekli ikonların nasıl oluşturulacağını açıklar.

## Gerekli İkon Boyutları

### Android / Chrome
- 192x192 - manifest.json için
- 512x512 - manifest.json için
- 144x144 - Windows tile
- 96x96 - küçük ikon
- 72x72 - küçük ikon
- 48x48 - çok küçük ikon

### iOS / Safari
- 180x180 - apple-touch-icon
- 152x152 - iPad
- 120x120 - iPhone
- 76x76 - iPad mini

### Favicon
- 32x32 - standart favicon
- 16x16 - küçük favicon

## İkon Oluşturma

### Yöntem 1: Online Araçlar
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

### Yöntem 2: Manuel (ImageMagick)
```bash
# Ana logonuzdan (logo.png) tüm boyutları oluştur
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 512x512 icon-512.png
convert logo.png -resize 180x180 apple-touch-icon.png
convert logo.png -resize 144x144 icon-144.png
convert logo.png -resize 96x96 icon-96.png
convert logo.png -resize 72x72 icon-72.png
convert logo.png -resize 48x48 icon-48.png
convert logo.png -resize 32x32 favicon-32x32.png
convert logo.png -resize 16x16 favicon-16x16.png
```

### Yöntem 3: Placeholder Oluştur
Geliştirme için placeholder SVG ikonlar kullanabilirsiniz.

## İkonları /public Klasörüne Koy

Oluşturulan ikonları `/public/icons/` klasörüne yerleştirin:
```
/public/
  /icons/
    icon-16.png
    icon-32.png
    icon-48.png
    icon-72.png
    icon-96.png
    icon-144.png
    icon-192.png
    icon-512.png
    apple-touch-icon.png
  favicon.ico
```

## Not
Bu proje için placeholder ikonlar kullanıyoruz. Production'da gerçek logo ile değiştirilmelidir.
