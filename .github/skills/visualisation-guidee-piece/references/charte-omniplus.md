# Charte graphique OMNIplus ON (Daimler Buses)

Palette relevée sur le portail OMNIplus ON : cyan `#00ADEE`, bleu nuit `#041E42`, gris-bleu `#627389`, accent `#3399FF`, fond `#F0F2F4`, coins 4 px. Police du portail : DaimlerCS (**propriétaire, non embarquée**) → police système neutre (`"Segoe UI","Helvetica Neue",Arial,system-ui`). Ne pas reproduire le logo.

| Jeton | Clair (par défaut) | Sombre (bleu nuit) |
|---|---|---|
| `--bg` / `--panel` | `#f0f2f4` / `#ffffff` | `#061327` / `#0b2345` |
| `--txt` / `--mut` | `#041e42` / `#566b84` | `#e6eef7` / `#9fb3cc` |
| `--acc` (accent) / `--acc2` (texte accent) | `#00adee` / `#00709e` | `#00adee` / `#6ad3f7` |
| `--on-bg` / `--on-fg` (états actifs pleins) | `#041e42` / `#ffffff` | `#00adee` / `#041e42` |
| bouton principal | fond bleu nuit, texte blanc | fond cyan, texte bleu nuit |

Règles : accent cyan en **fond** ou en **trait**, jamais en texte sur blanc (contraste 2,6:1) → `--acc2`. Liseré du bandeau : dégradé cyan → bleu nuit. Thème **clair par défaut**. Couleurs de **fonction** SSP inchangées (orange pression/couple, bleu lubrification, vert commande, gris pièce folle, rouge défaut). Intégration : `templates/theme-omniplus.css` à ajouter **en fin** de `style.css`.
