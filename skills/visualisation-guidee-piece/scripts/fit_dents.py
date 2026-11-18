import numpy as np, itertools
from scipy.optimize import least_squares
# topologie trouvée (groupes) : S1=g0 C1=g1 R1=g2 S2=g0 C2=g3 R2=g1 S3=g4 C3=g2 R3=g5 I=g4 O=g3 ; A: I->g0 ; B: I->g1 ; D: R3 ; E: g2 (R1+C3) ; F: g1 (C1+R2)
part = [0, 1, 2, 0, 3, 1, 4, 2, 5, 4, 3]
PG = [(0, 1, 2), (3, 4, 5), (6, 7, 8)]
G = 6
ring = {'D': 5, 'E': 2, 'F': 1}; clutch = {'A': 0, 'B': 1}
TABLE = {1: ('A', 'F'), 2: ('A', 'E'), 3: ('A', 'D'), 4: ('A', 'B'), 5: ('B', 'D'), 6: ('B', 'E'), 'R': ('D', 'F')}
TARGET = {1: 3.364, 2: 1.975, 3: 1.444, 4: 1.0, 5: 0.696, 6: 0.587, 'R': -3.769}

def ratio(rho, k):
    rows, rhs = [], []
    for p, (s, c, r) in enumerate(PG):
        row = np.zeros(G); row[part[s]] += 1; row[part[r]] += rho[p]; row[part[c]] -= 1 + rho[p]; rows.append(row); rhs.append(0)
    row = np.zeros(G); row[part[9]] = 1; rows.append(row); rhs.append(1)
    for e in TABLE[k]:
        row = np.zeros(G)
        if e in clutch: row[part[9]] += 1; row[clutch[e]] -= 1
        else: row[ring[e]] += 1
        rows.append(row); rhs.append(0)
    x = np.linalg.solve(np.array(rows), np.array(rhs))
    return 1 / x[part[10]]

def res(x):
    rho = np.exp(x); return [(ratio(rho, k) - TARGET[k]) / TARGET[k] for k in TARGET]

sol = least_squares(res, np.log([2.3, 2.3, 1.7]), xtol=1e-14, ftol=1e-14)
rho = np.exp(sol.x); print('rho', rho)
print({k: round(ratio(rho, k), 4) for k in TARGET})
# dents entiers : plusieurs planètes (3 ou 4) -> (Zs+Zr) multiple du nombre de satellites, Zr-Zs pair
def cands(r, name):
    out = []
    for Zs in range(16, 80):
        for Zr in range(Zs + 8, 170):
            if (Zr - Zs) % 2: continue
            rr = Zr / Zs
            if abs(rr / r - 1) < 0.002:
                out.append((abs(rr / r - 1), Zs, Zr, (Zr - Zs) // 2))
    out.sort()
    return out[:8]
for i, r in enumerate(rho):
    print('train', i + 1, r, cands(r, i))
