"""Recherche de la topologie cinématique (3 trains simples, 2 embrayages A/B, 3 freins D/E/F sur des couronnes)
qui reproduit EXACTEMENT le tableau de rapports ZF EcoLife 2 : 1:A+F 3,364 · 2:A+E 1,975 · 3:A+D 1,444 · 4:A+B 1,000 · 5:B+D 0,696 · 6:B+E 0,587 · AR:D+F -3,769"""
import itertools, sys, random, json
import numpy as np
from scipy.optimize import least_squares

TABLE = {1: ('A', 'F'), 2: ('A', 'E'), 3: ('A', 'D'), 4: ('A', 'B'), 5: ('B', 'D'), 6: ('B', 'E'), 'R': ('D', 'F')}
TARGET = {1: 3.364, 2: 1.975, 3: 1.444, 4: 1.0, 5: 0.696, 6: 0.587, 'R': -3.769}
# items : 0..8 = S1 C1 R1 S2 C2 R2 S3 C3 R3 ; 9 = entrée I ; 10 = sortie O
N = 11
PG = [(0, 1, 2), (3, 4, 5), (6, 7, 8)]

def partitions(n):
    a = [0] * n
    def rec(i, m):
        if i == n:
            yield list(a); return
        for v in range(m + 1):
            a[i] = v
            yield from rec(i + 1, max(m, v + 1) if v == m else m)
    # restricted growth strings
    def rg(i, m):
        if i == n:
            yield list(a); return
        for v in range(m + 1):
            a[i] = v
            yield from rg(i + 1, m + 1 if v == m else m)
    yield from rg(1, 1)   # a[0] = 0

def solve(groups, G, rho, engaged, ring_groups, clutch_groups):
    """Vitesses de chaque groupe, entrée = 1. Retourne ratio entrée/sortie ou None si indéterminé."""
    rows, rhs = [], []
    gI, gO = groups[9], groups[10]
    for p, (s, c, r) in enumerate(PG):
        row = np.zeros(G); row[groups[s]] += 1; row[groups[r]] += rho[p]; row[groups[c]] -= (1 + rho[p]); rows.append(row); rhs.append(0.0)
    row = np.zeros(G); row[gI] = 1; rows.append(row); rhs.append(1.0)
    for e in engaged:
        row = np.zeros(G)
        if e in ('A', 'B'):
            row[gI] += 1; row[clutch_groups[e]] -= 1
        else:
            row[ring_groups[e]] += 1
        rows.append(row); rhs.append(0.0)
    A = np.array(rows); b = np.array(rhs)
    x, res, rk, sv = np.linalg.lstsq(A, b, rcond=None)
    if np.linalg.norm(A @ x - b) > 1e-7:
        return None
    # sortie déterminée ?
    u, s, vt = np.linalg.svd(A)
    null = vt[(s > 1e-9).sum():]
    if len(null) and np.abs(null[:, gO]).max() > 1e-7:
        return None
    w = x[gO]
    if abs(w) < 1e-9:
        return None
    return 1.0 / w

def main():
    W = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    wid = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    random.seed(1 + wid); np.random.seed(1 + wid)
    found = []
    count = 0
    rho0 = np.array([2.0, 2.3, 2.6])
    idx = -1
    for part in partitions(N):
        idx += 1
        if idx % W != wid: continue
        G = max(part) + 1
        if G < 5 or G > 8: continue
        # les 3 noeuds d'un train sont dans des groupes différents ; entrée et sortie dans des groupes différents
        if any(len({part[i] for i in pg}) < 3 for pg in PG): continue
        if part[9] == part[10]: continue
        ringsg = [part[2], part[5], part[8]]
        if len(set(ringsg)) < 3: continue
        if part[9] in ringsg or part[10] in ringsg: continue
        for perm in itertools.permutations(range(3)):
            ring_groups = {'D': ringsg[perm[0]], 'E': ringsg[perm[1]], 'F': ringsg[perm[2]]}
            gI = part[9]
            for ga in range(G):
                if ga == gI: continue
                for gb in range(G):
                    if gb == gI or gb == ga: continue
                    cg = {'A': ga, 'B': gb}
                    count += 1
                    r4 = solve(part, G, rho0, TABLE[4], ring_groups, cg)
                    if r4 is None or abs(r4 - 1.0) > 1e-6: continue
                    ok = True
                    for k in (1, 2, 3, 5, 6, 'R'):
                        if solve(part, G, rho0, TABLE[k], ring_groups, cg) is None: ok = False; break
                    if not ok: continue
                    # ajustement des 3 rapports de dents
                    def res(x):
                        rho = np.exp(x)
                        out = []
                        for k in (1, 2, 3, 5, 6, 'R'):
                            r = solve(part, G, rho, TABLE[k], ring_groups, cg)
                            out.append((r - TARGET[k]) / TARGET[k] if r is not None else 10.0)
                        return out
                    best = None
                    for st in range(4):
                        x0 = np.log(np.array([random.uniform(1.4, 3.6) for _ in range(3)]))
                        try:
                            sol = least_squares(res, x0, bounds=(np.log(1.2), np.log(5.0)))
                        except Exception:
                            continue
                        if best is None or sol.cost < best.cost: best = sol
                    if best is not None and np.abs(best.fun).max() < 2e-3:
                        found.append({'part': part, 'perm': perm, 'A': ga, 'B': gb, 'rho': np.exp(best.x).tolist(), 'err': float(np.abs(best.fun).max())})
                        print('TROUVÉ', json.dumps(found[-1]), flush=True)
    print('évalué', count, 'trouvés', len(found), flush=True)
    json.dump(found, open(f'topo_found_{wid}.json', 'w'))

if __name__ == '__main__':
    main()
