"""Ajoute transitions cinématiques + animations d'entrée (cascade automatique) au PPTX généré par pptxgenjs."""
import json, sys
from pptx import Presentation
from lxml import etree

NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
NS_MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006'
NS_P14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main'
P = '{%s}' % NS_P

# ----- transitions : type -> (élément p14, durée ms, secours standard)
P14 = {
    'pan': ('<p14:pan dir="r"/>', 1300, '<p:push dir="l"/>'),
    'vortex': ('<p14:vortex dir="r"/>', 1600, '<p:fade/>'),
    'flythrough': ('<p14:flythrough dir="in" hasBounce="1"/>', 1500, '<p:zoom dir="in"/>'),
    'conveyor': ('<p14:conveyor dir="r"/>', 1400, '<p:push dir="l"/>'),
    'ferris': ('<p14:ferris dir="r"/>', 1500, '<p:push dir="l"/>'),
    'flash': ('<p14:flash/>', 900, '<p:fade thruBlk="1"/>'),
    'ripple': ('<p14:ripple dir="center"/>', 1800, '<p:fade/>'),
    'gallery': ('<p14:gallery dir="r"/>', 1400, '<p:push dir="l"/>'),
}

def transition_xml(kind, adv_ms):
    adv = ' advClick="1"' + (f' advTm="{adv_ms}"' if adv_ms else '')
    if kind == 'fadeblack':
        return f'<p:transition xmlns:p="{NS_P}" spd="slow"{adv}><p:fade thruBlk="1"/></p:transition>'
    if kind == 'fade':
        return f'<p:transition xmlns:p="{NS_P}" spd="med"{adv}><p:fade/></p:transition>'
    el, dur, fb = P14[kind]
    return (f'<mc:AlternateContent xmlns:mc="{NS_MC}" xmlns:p="{NS_P}">'
            f'<mc:Choice xmlns:p14="{NS_P14}" Requires="p14"><p:transition spd="slow"{adv} p14:dur="{dur}">{el}</p:transition></mc:Choice>'
            f'<mc:Fallback><p:transition spd="med"{adv}>{fb}</p:transition></mc:Fallback></mc:AlternateContent>')

# ----- animations d'entrée
class Ids:
    def __init__(self): self.n = 2
    def next(self):
        self.n += 1
        return self.n

def tgt(spid): return f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'

def set_vis(ids, spid):
    return (f'<p:set><p:cBhvr><p:cTn id="{ids.next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>{tgt(spid)}'
            f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>')

def anim_attr(ids, spid, attr, v0, v1, dur, additive=False, flt0=False):
    a = ' additive="base"' if additive else ''
    t0 = f'<p:fltVal val="{v0}"/>' if flt0 else f'<p:strVal val="{v0}"/>'
    return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr{a}><p:cTn id="{ids.next()}" dur="{dur}" fill="hold"/>{tgt(spid)}'
            f'<p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val>{t0}</p:val></p:tav>'
            f'<p:tav tm="100000"><p:val><p:strVal val="{v1}"/></p:val></p:tav></p:tavLst></p:anim>')

def anim_effect(ids, spid, flt, dur):
    return (f'<p:animEffect transition="in" filter="{flt}"><p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}"/>{tgt(spid)}</p:cBhvr></p:animEffect>')

def effect_xml(ids, spid, kind, delay, grp, is_sp):
    dur = 600
    pid, sub = {'fade': (10, 0), 'wipe': (22, 8), 'fly': (2, 4), 'zoom': (53, 16)}[kind]
    g = ' grpId="0"' if grp else ''
    cid = ids.next()
    head = (f'<p:par><p:cTn id="{cid}" presetID="{pid}" presetClass="entr" presetSubtype="{sub}" fill="hold"{g} nodeType="withEffect">'
            f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>')
    body = set_vis(ids, spid)
    if kind == 'fade':
        body += anim_effect(ids, spid, 'fade', dur)
    elif kind == 'wipe':
        body += anim_effect(ids, spid, 'wipe(left)', dur)
    elif kind == 'fly':
        body += anim_attr(ids, spid, 'ppt_x', '#ppt_x', '#ppt_x', dur, True)
        body += anim_attr(ids, spid, 'ppt_y', '1+#ppt_h/2', '#ppt_y', dur, True)
    elif kind == 'zoom':
        body += anim_attr(ids, spid, 'ppt_w', 0, '#ppt_w', dur, False, True)
        body += anim_attr(ids, spid, 'ppt_h', 0, '#ppt_h', dur, False, True)
        body += anim_effect(ids, spid, 'fade', dur)
    return head + body + '</p:childTnLst></p:cTn></p:par>'

def timing_xml(sld, anims):
    # nom d'objet -> (id, type)
    idx = {}
    for c in sld.iter('{%s}cNvPr' % NS_P):
        owner = c.getparent().getparent().tag.split('}')[1]
        idx[c.get('name')] = (c.get('id'), owner)
    ids = Ids()
    effects, bld = [], []
    for a in anims:
        if a['name'] not in idx: continue
        spid, owner = idx[a['name']]
        grp = owner in ('sp', 'graphicFrame')
        effects.append(effect_xml(ids, spid, a['fx'], int(a['delay']), grp, owner == 'sp'))
        if owner == 'sp': bld.append(f'<p:bldP spid="{spid}" grpId="0" animBg="1"/>')
        elif owner == 'graphicFrame': bld.append(f'<p:bldGraphic spid="{spid}" grpId="0"><p:bldAsOne/></p:bldGraphic>')
    if not effects: return None
    outer, inner = 3, 4
    # ids : on réserve 1 (racine), 2 (mainSeq) ; les effets ont déjà consommé des ids à partir de 3 -> on renumérote proprement
    xml = ('<p:timing xmlns:p="%s"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
           '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
           '<p:par><p:cTn id="%d" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
           '<p:par><p:cTn id="%d" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>%s</p:childTnLst></p:cTn></p:par>'
           '</p:childTnLst></p:cTn></p:par>'
           '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
           '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>'
           '%s</p:timing>') % (NS_P, ids.next(), ids.next(), ''.join(effects), ('<p:bldLst>' + ''.join(bld) + '</p:bldLst>') if bld else '')
    return xml

def build(src, dst, auto):
    plan = json.load(open('plan.json'))
    prs = Presentation(src)
    for i, slide in enumerate(prs.slides, start=1):
        pl = plan.get(str(i))
        if not pl: continue
        sld = slide._element
        # nettoyage éventuel
        for tag in ('transition', 'timing'):
            for e in sld.findall(P + tag): sld.remove(e)
        for e in list(sld):
            if e.tag.endswith('AlternateContent'): sld.remove(e)
        maxd = max([a['delay'] for a in pl['anim']] + [0])
        has_video = any(sh.shape_type is not None and 'MEDIA' in str(sh.shape_type) for sh in slide.shapes)
        adv = None
        if auto:
            adv = 11000 if has_video else max(8500, maxd + 5500)
            if pl['transition']['k'] in ('fadeblack',): adv = 7500
        tr = etree.fromstring(transition_xml(pl['transition']['k'], adv))
        anchor = sld.find(P + 'clrMapOvr')
        if anchor is None: anchor = sld.find(P + 'cSld')
        anchor.addnext(tr)
        tm = timing_xml(sld, pl['anim'])
        if tm:
            tn = etree.fromstring(tm)
            tr.addnext(tn)
    prs.save(dst)
    print('écrit', dst)

if __name__ == '__main__':
    build('raw.pptx', 'TransmiLab3D_Presentation.pptx', False)
    build('raw.pptx', 'TransmiLab3D_Presentation_Auto.pptx', True)
