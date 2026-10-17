"""Régénère la carte avec QR code.
Usage : python3 outils/make_qr.py https://adresse-de-votre-site.fr
(nécessite : pip install opencv-contrib-python pillow numpy)
Sans argument : QR de contact (fiche Tony Blackwolf)."""
import sys, os, cv2, numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "..", "assets")
BASE = os.path.join(A, "base-sans-1pct.png")
DEFAULT = "MECARD:N:Tony Blackwolf;TEL:+33767391856;EMAIL:TonyBlackwolf188@gmail.com;;"
payload = sys.argv[1].strip() if len(sys.argv) > 1 else DEFAULT

m = cv2.QRCodeEncoder.create().encode(payload)
n = m.shape[0]

def render(px, quiet):
    size = (n + 2*quiet) * px
    img = np.full((size, size), 255, np.uint8)
    img[quiet*px:quiet*px+n*px, quiet*px:quiet*px+n*px] = cv2.resize(m, None, fx=px, fy=px, interpolation=cv2.INTER_NEAREST)
    return Image.fromarray(img).convert("RGB")

render(14, 3).save(os.path.join(A, "qr-contact.png"))

card = Image.open(BASE).convert("RGB")
W, H = card.size
# QR placé dans la zone noire libre, à droite du numéro de téléphone (zone ~125 px)
px = 3 if n <= 37 else 2
qr = render(px, 2)
w = qr.size[0]
x0 = 1516
y0 = 452 + (123 - w)//2
d = ImageDraw.Draw(card)
d.rounded_rectangle([x0-4, y0-4, x0+w+3, y0+w+3], radius=8, fill=(255,255,255), outline=(230,20,20), width=3)
card.paste(qr, (x0, y0))
card.save(os.path.join(A, "carte-qr.png"))
card.save(os.path.join(A, "carte-qr.jpg"), quality=93)
print("modules:", n, "| taille sur la carte:", w, "px | contenu:", payload)

det = cv2.QRCodeDetector()
for name in ("carte-qr.png", "qr-contact.png"):
    img = cv2.imread(os.path.join(A, name))
    val, _, _ = det.detectAndDecode(img)
    if not val:
        crop = cv2.resize(img[y0-20:y0+w+20, x0-20:x0+w+20], None, fx=4, fy=4, interpolation=cv2.INTER_NEAREST)
        val, _, _ = det.detectAndDecode(crop)
    print(name, "->", "OK (se scanne)" if val == payload else "ÉCHEC")
